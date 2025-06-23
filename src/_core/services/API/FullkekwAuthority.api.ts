import { $http } from '~/services/HTTPService';
import { FullkekwAuthorityAPI_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { HandleAPIError } from '~/services/ErrorService';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface VerifyTokenProps {
  token: string
}



const baseURL = config.URL.fullkekw_authority;
const APINAME = 'fullkekw-authority';



/** @version 2.1.1 */
export class FullkekwAuthorityAPI {
  static async verifyToken(payload: VerifyTokenProps) {
    try {
      const url = `${baseURL}/verify`;
      Logger.trace(`[FullkekwAuthorityAPI]: POST - ${url.replace(baseURL, '')}`);

      const { data } = await $http.post<FullkekwAuthorityAPI_TokenVerify>(url, payload);

      return data;
    } catch (e) {
      HandleAPIError(e, APINAME);
    }
  }
}



export default FullkekwAuthorityAPI;