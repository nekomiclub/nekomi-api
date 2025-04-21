import { $http } from '~/services/HTTPService';
import { FullkekwAuthorityAPI_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface IVerifyTokenProps {
  token: string
}



const baseURL = config.URL.fullkekw_authority;

/** @version 2.1.1 */
export class FullkekwAuthorityAPI {
  static async verifyToken(payload: IVerifyTokenProps) {
    const url = `${baseURL}/verify`;
    Logger.trace(`[FullkekwAuthorityAPI]: POST - ${url.replace(baseURL, '')}`);

    const { data } = await $http.post<FullkekwAuthorityAPI_TokenVerify>(url, payload);

    return data;
  }
}



export default FullkekwAuthorityAPI;