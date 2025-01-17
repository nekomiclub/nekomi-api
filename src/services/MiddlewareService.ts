import * as cfg from '../config';

import User from '../Models/User';
import { $http } from './HTTPService';
import { E404, E500, ERR_ACCESS_REJECTED } from './ErrorService';
import { FK_AUTHORITY_ROUTES, IFK_AuthorityVerify } from '../interfaces/http/FkAuthority';
import { FK_USAPI_ROUTES, IFK_UsapiAuthRefresh } from '../interfaces/http/FkUsapi';
import { HydratedDocument } from 'mongoose';
import { IM_FkAuthorityVerify, IM_FkUsapiAuthRefresh } from '../interfaces/Mocks';
import { IUser } from '../interfaces/User';
import { TRoleCapability } from '../interfaces/Roles';
import { parseRoles } from '../Models/Role';

interface Props {
  TestMode?: boolean
}

export type TMiddlewareName = 'checkAccess' | 'checkCSRF';


export class MiddlewareService {
  private TestMode = cfg.TestMode;

  constructor(props?: Props) {
    if (props) {
      const { TestMode } = props;

      this.TestMode = TestMode !== undefined ? TestMode : cfg.TestMode;
    }
  }

  /** Check user authorization
   * If capabilities are not specified, will only parse authorization token
   * 
   * @param token Authorization token
   * @param capabilities Required capabilities. Will pass if user have every required capability or capabilities is not specified 
   * 
   * @returns user
   */
  async checkAccess(token: string, capabilities?: TRoleCapability[], mockData?: IM_FkUsapiAuthRefresh): Promise<{ user: HydratedDocument<IUser>, capabilities: TRoleCapability[] }> {
    capabilities = capabilities !== undefined ? capabilities : [];

    const DATA: IM_FkUsapiAuthRefresh = {
      id: '',
      avatar: '',
      username: '',
      capabilities: []
    };

    if (!this.TestMode) {
      const { data: sessionData } = await $http.get<IFK_UsapiAuthRefresh>(FK_USAPI_ROUTES.refresh, {
        headers: {
          Cookie: `session=${token}`
        }
      });

      DATA.id = sessionData.id;
      DATA.username = sessionData.username;
      DATA.avatar = sessionData.avatar;
    } else {
      if (!mockData) throw new E500('CSRF MOCK DATA IS NOT SPECIFIED');

      DATA.id = mockData.id;
      DATA.capabilities = mockData.capabilities;
      DATA.username = mockData.username;
      DATA.avatar = mockData.avatar;
    }

    const user = await User.findOne({ id: DATA.id });
    if (!user) throw new E404(`User ${DATA.id} is not found`);

    // TODO: Sync user username & avatar

    //* Pass if no capabilities required
    if (!capabilities.length) return { user, capabilities: [] };

    const caps = this.TestMode ? DATA.capabilities : await parseRoles(user.roles);

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
  async checkCSRF(token: string, origins?: string[], mockData?: IM_FkAuthorityVerify): Promise<string> {
    origins = origins !== undefined ? origins : [];

    const DATA: IM_FkAuthorityVerify = {
      origin: 'NULL',
      verified: false
    };

    if (!this.TestMode) {
      const response = await $http.post<IFK_AuthorityVerify>(FK_AUTHORITY_ROUTES.verify, {
        token
      });

      DATA.origin = response.data.origin;
      DATA.verified = response.data.verified;
    } else {
      if (!mockData) throw new E500('CSRF MOCK DATA IS NOT SPECIFIED');

      DATA.origin = mockData.origin;
      DATA.verified = mockData.verified;
    }

    if (!DATA.verified || (origins.length !== 0 && !origins.includes(DATA.origin))) {
      throw new ERR_ACCESS_REJECTED('CSRF invalid');
    }

    return DATA.origin;
  }
}