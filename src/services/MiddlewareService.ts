import * as cfg from '../config';

import { AxiosError } from 'axios';
import { config } from '../config';
import { $http } from '../handlers/http';
import { FK_AUTHORITY_ROUTES, IFK_AuthorityVerify } from '../interfaces/FullkekwResponses';
import { IM_CSRFCheck } from '../interfaces/Mocks';
import { E500, ERR_ACCESS_REJECTED } from './ErrorService';

interface Props {
  testMode?: boolean
}

export class MiddlewareService {
  private testMode = cfg.testMode;

  constructor(props?: Props) {
    if (props) {
      const { testMode } = props;

      this.testMode = testMode !== undefined ? testMode : cfg.testMode;
    }
  }

  async checkAccess() {

  }

  /** Check CSRF token
   * @param token CSRF token
   * @param origins Will check if token origin match one of specified origins, if empty will only verify
   */
  async checkCSRF(token: string, origins?: string[], mockData?: IM_CSRFCheck): Promise<boolean> {
    origins = origins !== undefined ? origins : [];

    const DATA: IM_CSRFCheck = {
      origin: 'NULL',
      verified: false
    };

    if (!this.testMode) {
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

    return true;
  }
}