import FullkekwAuthorityAPI from '~/core/services/API/FullkekwAuthorityApi';
import FullkekwUserAPI from '~/core/services/API/FullkekwUserAPI';
import User from '~/models/User';
import { E404, E500, ERR_ACCESS_REJECTED } from './ErrorService';
import { FullkekwAuthorityAPI_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { FullkekwUserAPI_Verify } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { HydratedDocument } from 'mongoose';
import { IUser } from '~/core/interfaces/User.intf';
import { TRoleCapability } from '~/core/interfaces/Role.intf';
import { TestMode } from '~/config';
import { parseRoles } from '~/models/Role';



interface CheckAccessProps {
  token: string

  capabilities?: TRoleCapability[]
  mock?: FullkekwUserAPI_Verify
}

interface CheckCSRFProps {
  token: string

  origins?: string[]
  mock?: FullkekwAuthorityAPI_TokenVerify
}

export type TMiddlewareName = 'checkAccess' | 'checkCSRF';



export class MiddlewareService {
  /** Check user authorization
   * If capabilities are not specified, will only parse authorization token
   * 
   * @param token Authorization token
   * @param capabilities Required capabilities. Will pass if user have every required capability or capabilities is not specified 
   * 
   * @returns user
   */
  async checkAccess({ token, capabilities, mock }: CheckAccessProps): Promise<{ user: HydratedDocument<IUser>, capabilities: TRoleCapability[] }> {
    capabilities = capabilities !== undefined ? capabilities : [];

    const DATA: CheckAccessProps['mock'] = {
      id: '',
      avatar: '',
      username: '',
      capabilities: []
    };

    if (TestMode) {
      if (!mock) throw new E500('CSRF MOCK DATA IS NOT SPECIFIED');

      DATA.id = mock.id;
      DATA.capabilities = mock.capabilities;
      DATA.username = mock.username;
      DATA.avatar = mock.avatar;
    } else {
      const sessionData = await FullkekwUserAPI.refreshAuth({ sessionCookie: token });

      DATA.id = sessionData.id;
      DATA.username = sessionData.username;
      DATA.avatar = sessionData.avatar;
    }

    const user = await User.findOne({ id: DATA.id });
    if (!user) throw new E404(`User ${DATA.id} is not found`);

    // TODO: Sync user username & avatar

    //* Pass if no capabilities required
    if (!capabilities.length) return { user, capabilities: [] };

    const caps = TestMode ? DATA.capabilities : await parseRoles(user.roles);

    //* Pass if user is root
    if (caps.includes('root')) return { user, capabilities: caps };

    capabilities.forEach(cap => {
      if (!caps.includes(cap)) throw new ERR_ACCESS_REJECTED();
    });

    //* Pass if everything is ok
    return { user, capabilities: caps };
  }

  /** Check CSRF token
   * @param token CSRF token
   * @param origins Will check if token origin match one of specified origins, if empty will only verify
   * 
   * @returns CSRF origin
   */
  async checkCSRF({ token, origins, mock }: CheckCSRFProps): Promise<string> {
    origins = origins !== undefined ? origins : [];

    const DATA: CheckCSRFProps['mock'] = {
      origin: 'NULL',
      verified: false
    };

    if (TestMode) {
      if (!mock) throw new E500('CSRF MOCK DATA IS NOT SPECIFIED');

      DATA.origin = mock.origin;
      DATA.verified = mock.verified;
    } else {
      const data = await FullkekwAuthorityAPI.verifyToken({ token });

      DATA.origin = data.origin;
      DATA.verified = data.verified;
    }

    if (!DATA.verified || (origins.length !== 0 && !origins.includes(DATA.origin))) {
      throw new ERR_ACCESS_REJECTED('CSRF invalid');
    }

    return DATA.origin;
  }
}