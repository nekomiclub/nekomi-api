import CSRFService from './CSRFService';
import DTOService from './DataTransferService';
import IUser from '~/intf/IUser';
import SessionService from './SessionService';
import TokenService from './TokenService';
import conf, { DevelopmentMode, TestMode } from '~/config';
import { HandleMiddleware, getCSRFToken, getSessionToken, setSessionCookie } from '~/utils/http-utils';
import { ISessionToken } from '~/intf/IAuth';
import { NekoError } from './ExceptionService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { parseRolesPermissions } from '~/repo/RoleRepository';



export type MiddlewareType = keyof MiddlewareService;



interface ICheckAccess {
  user: IUser
  sessionId: string
  sessionToken: string

  /** Will be null if required permissions are not specified */
  permissions: ROLE_PERMISSION[] | null
}



export default class MiddlewareService {
  /**
   * Check user authorization
   * Will simply parse user if permissions are not specified, otherwise will ensure that user have required permission
   * Will refresh user access 
   */
  async checkAccess(token: string, permissions?: ROLE_PERMISSION[]): Promise<ICheckAccess> {
    const session = new SessionService();

    const { payload } = TokenService.decode<ISessionToken>(token);
    if (!payload.session_id || !payload.user_id) throw new NekoError('auth:session_token_invalid');

    let userPermissions: ROLE_PERMISSION[] | null = null;

    await session.init({ id: payload.user_id });
    const sessionToken = await session.refresh(payload.session_id);
    await session.save();

    // Ensure permissions
    if (permissions?.length) {
      userPermissions = await parseRolesPermissions(session.document!.roles);

      // Pass any checks for root 
      if (!userPermissions.includes(ROLE_PERMISSION.ABSOLUTE)) {
        permissions.forEach(perm => {
          if (!userPermissions?.includes(perm)) throw new NekoError('sys:action_prevented', `Lack of permission: ${perm}`);
        });
      }
    }



    return {
      user: DTOService.user(session.document!),
      permissions: userPermissions,
      sessionId: payload.session_id,
      sessionToken,
    };
  }



  /**
   * Parse & verify CSRF token
   * If origins provided, will match token origin with allowed
   * 
   * @param token In development or test mode "~dev" value can be passed to use fresh nekomi-api token
   * @returns origin
   */
  async checkCSRF(token: string, origins: string[] = []): Promise<string> {
    // In development mode append nekomi api origin to pass "~dev" token
    if ((DevelopmentMode || TestMode) && origins?.length) origins.push(conf.domains.NEKOMI_API_DOMAIN);

    // In development mode issue fresh token for "~dev"
    if ((DevelopmentMode || TestMode) && token === '~dev') token = CSRFService.signToken(null);



    const csrf = await CSRFService.verify(token);
    if (!csrf.verified) throw new NekoError('auth:csrf_token_invalid');

    // Pass verifying if origin is nekomi admin
    if (csrf.origin !== conf.domains.NEKOMI_ADMIN_DOMAIN) {
      if (origins.length !== 0 && !origins.includes(csrf.origin!)) throw new NekoError('auth:csrf_token_invalid', `Origin is not allowed`);
    }

    return csrf.origin!;
  }
}



class MiddlewareClass {
  private service = new MiddlewareService();



  /** Middleware wrapper for {@link MiddlewareService.checkAccess} */
  CheckAccess = (permissions?: ROLE_PERMISSION[]) => HandleMiddleware(async (req, res) => {
    const token = getSessionToken(req);

    const { user, sessionToken, permissions: userPermissions, sessionId } = await this.service.checkAccess(token, permissions);

    setSessionCookie(sessionToken, res);



    req._nekomi.middlewaresPassed?.push('checkAccess');
    req._nekomi.sessionToken = sessionToken;

    req._nekomi.user = {
      id: user.id,
      sessionId,
      permissions: userPermissions,
    };
  });



  /** Middleware wrapper for {@link MiddlewareService.checkCSRF} */
  CheckCSRF = (origins?: string[]) => HandleMiddleware(async (req) => {
    const token = getCSRFToken(req);
    const origin = await this.service.checkCSRF(token, origins);

    req._nekomi.middlewaresPassed?.push('checkCSRF');
    req._nekomi.csrfOrigin = origin;
  });
}



export const Middleware = new MiddlewareClass();