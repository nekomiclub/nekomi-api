import CSRFService from './CSRFService';
import DTS from './DataTransferService';
import IUser from '~/schemas/entities/User.schema';
import SessionService from './SessionService';
import TokenService from './TokenService';
import conf, { DevelopmentMode, TestMode } from '~/conf';
import { HandleMiddleware, getCSRFToken, getSessionToken } from '~/utils/http-utils';
import { NekoError } from './ExceptionService';
import { ROLE_PERMISSION } from '~/schemas/entities/Role.schema';
import { SessionTokenSchema, SessionTokenType } from '~/schemas/auth.schema';
import { parseRolesPermissions } from '~/repo/RoleRepository';



export type MiddlewareType = keyof MiddlewareService;



interface ICheckAccess {
  user: IUser
  sessionId: string

  /** Will be null if required permissions are not specified */
  permissions: ROLE_PERMISSION[] | null
}



export default class MiddlewareService {
  /**
   * Check user authorization
   * Will simply parse user if permissions are not specified, otherwise will ensure that user have required permission
   */
  async checkAccess(token: string, permissions?: ROLE_PERMISSION[]): Promise<ICheckAccess> {
    const { payload } = TokenService.decode<SessionTokenType>(token);
    if (!SessionTokenSchema.safeParse(payload).success) throw new NekoError('auth:session_token_invalid');

    const session = new SessionService();
    await session.init({ id: payload.user_id });
    await session.parse(token);

    let userPermissions: ROLE_PERMISSION[] | null = null;



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
      user: DTS.user(session.document!),
      permissions: userPermissions,
      sessionId: payload.session_id,
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



  /** 
   * Middleware wrapper for {@link MiddlewareService.checkAccess} 
   */
  CheckAccess = (permissions?: ROLE_PERMISSION[]) => HandleMiddleware(async (req, res) => {
    const token = getSessionToken(req);

    const { user, permissions: userPermissions, sessionId } = await this.service.checkAccess(token, permissions);



    req._nekomi.middlewaresPassed?.push('checkAccess');

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