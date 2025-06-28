import FullkekwAuthority from '~/core/services/API/FullkekwAuthority.api';
import FullkekwUser from '~/core/services/API/FullkekwUser.api';
import User from '~/core/interfaces/User.intf';
import UserService from '~/core/services/UserService';
import { AxiosError } from 'axios';
import { E403 } from './ErrorService';
import { ERROR_AUTH_CSRF_INVALID, ERROR_AUTH_SESSION_EXPIRED, ERROR_MOCK_UNDEFINED } from './Exceptions';
import { FullkekwAuthority_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { FullkekwUser_Verify } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { Logger } from './LoggerService';
import { RoleCapability } from '~/core/interfaces/Role.intf';
import { TestMode } from '~/config';
import { parseRoles } from '~/core/services/RoleService';



interface CheckAccessProps {
  token: string

  capabilities?: RoleCapability[]
  mock?: FullkekwUser_Verify
}

interface CheckCSRFProps {
  token: string

  origins?: string[]
  mock?: FullkekwAuthority_TokenVerify
}

export type TMiddlewareName = 'checkAccess' | 'checkCSRF';



export class MiddlewareService {
  /** 
   * Check user authorization
   * If capabilities are not specified, will only parse authorization token
   * Will verify user authorization & fetch actual username / avatar
   * 
   * @param token Authorization token
   * @param capabilities Required capabilities. Will pass if user have every required capability or capabilities is not specified 
   * @tested as part of GET /user
   * 
   * @returns user
   */
  async checkAccess({ token, capabilities, mock }: CheckAccessProps): Promise<{ user: User, capabilities: RoleCapability[] }> {
    capabilities = capabilities ?? [];

    const session: FullkekwUser_Verify = {
      id: '',
      avatar: '',
      username: '',
      capabilities: []
    };



    if (!TestMode) {
      try {
        const sessionData = await FullkekwUser.refreshAuth({ sessionCookie: token });

        session.id = sessionData.id;
        session.username = sessionData.username;
        session.avatar = sessionData.avatar;
      } catch (e) {
        if (e instanceof AxiosError && (e.response?.data.code === 'session:not_exist' || e.response?.data.code === 'session:not_verified')) throw ERROR_AUTH_SESSION_EXPIRED;

        throw e;
      }
    } else {
      if (!mock) throw ERROR_MOCK_UNDEFINED;

      session.id = mock.id;
      session.capabilities = mock.capabilities;
      session.username = mock.username;
      session.avatar = mock.avatar;
    }

    const user = await new UserService().getById(session.id);

    // Sync with fullkekw-userapi
    try {
      if (user.avatar !== session.avatar || user.username !== session.username) {
        const userService = new UserService();
        await userService.init(user.id);

        if (user.avatar !== session.avatar) userService.setAvatar(session.avatar);
        if (user.username !== session.username) userService.setUsername(session.username);

        Logger.info(`[MiddlewareService]: User synced with fullkekw-userapi`);

        await userService.save();
      }
    } catch (e) {
      Logger.fail(`[MiddlewareService]: Cannot sync user with fullkekw-userapi. [userId: ${session.id}]`, e);
    }

    // Pass if no capabilities required
    if (!capabilities.length) return { user, capabilities: [] };

    const caps = TestMode ? session.capabilities : await parseRoles(user.roles);

    // Pass if user is root
    if (caps.includes('root')) return { user, capabilities: caps };

    capabilities.forEach(cap => {
      if (!caps.includes(cap)) throw new E403;
    });

    // Pass if everything is ok
    return { user, capabilities: caps };
  }



  /** 
   * Check CSRF token
   * 
   * @param token CSRF token
   * @param origins Will check if token origin match one of specified origins, if empty will only verify
   * 
   * @returns CSRF origin
   */
  async checkCSRF({ token, origins, mock }: CheckCSRFProps): Promise<string> {
    origins = origins ?? [];

    const csrf: FullkekwAuthority_TokenVerify = {
      origin: '',
      verified: false
    };

    if (!TestMode) {

      const data = await FullkekwAuthority.verifyToken({ token });

      csrf.origin = data.origin;
      csrf.verified = data.verified;
    } else {
      if (!mock) throw ERROR_MOCK_UNDEFINED;

      csrf.origin = mock.origin;
      csrf.verified = mock.verified;
    }

    if (!csrf.verified || (origins.length !== 0 && !origins.includes(csrf.origin))) throw ERROR_AUTH_CSRF_INVALID;

    return csrf.origin;
  }
}