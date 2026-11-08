import DTS from './DataTransferService.js';
import IUser from '~/schemas/entities/User.schema.js';
import SessionService from './SessionService.js';
import TokenService from './TokenService.js';
import env from '~/utils/env.js';
import { HandleMiddleware, getAPIKey, getAuthorizationToken } from '~/utils/http-utils.js';
import { NekoError } from './ExceptionService.js';
import { ROLE_PERMISSION_ENUM } from '~/schemas/entities/Role.schema.js';
import { SessionTokenSchema, SessionTokenType } from '~/schemas/auth.schema.js';
import { parseRolesPermissions } from '~/repositories/RoleRepository.js';



export type MiddlewareType = keyof MiddlewareService;



interface ICheckAccess {
  user: IUser
  sessionId: string

  /** Will be null if required permissions are not specified */
  permissions: ROLE_PERMISSION_ENUM[] | null
}



export default class MiddlewareService {
  /**
   * Check user authorization
   * Will simply parse user if permissions are not specified, otherwise will ensure that user have required permission
   */
  async checkAccess(token: string, permissions?: ROLE_PERMISSION_ENUM[]): Promise<ICheckAccess> {
    const { payload } = TokenService.decode<SessionTokenType>(token);
    if (!SessionTokenSchema.safeParse(payload).success) throw new NekoError('auth:session_token_invalid');

    const session = new SessionService();
    await session.init({ id: payload.user_id });
    await session.parse(token);

    let userPermissions: ROLE_PERMISSION_ENUM[] | null = null;



    // Ensure permissions
    if (permissions?.length) {
      userPermissions = await parseRolesPermissions(session.document!.roles);

      // Pass any checks for root 
      if (!userPermissions.includes(ROLE_PERMISSION_ENUM.ABSOLUTE)) {
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



  /** Verify API key */
  async checkAPIKey(token: string): Promise<boolean> {
    const isMatched = env('API_KEY_SK') === token;
    if (!isMatched) throw new NekoError('auth:api_key_invalid', `API key is invalid`);

    return isMatched;
  }
}



class MiddlewareClass {
  private service = new MiddlewareService();



  /** 
   * Middleware wrapper for {@link MiddlewareService.checkAccess} 
   */
  CheckAccess = (permissions?: ROLE_PERMISSION_ENUM[]) => HandleMiddleware(async (req, res) => {
    const token = getAuthorizationToken(req);

    const { user, permissions: userPermissions, sessionId } = await this.service.checkAccess(token, permissions);




    req._nekomi.middlewaresPassed?.push('checkAccess');

    req._nekomi.user = {
      id: user.id,
      sessionId,
      permissions: userPermissions,
    };
  });



  /** Middleware wrapper for {@link MiddlewareService.checkAPIKey} */
  CheckAPIKey = () => HandleMiddleware(async (req) => {
    const token = getAPIKey(req);
    await this.service.checkAPIKey(token);

    req._nekomi.middlewaresPassed?.push('checkAPIKey');
  });
}



export const Middleware = new MiddlewareClass();