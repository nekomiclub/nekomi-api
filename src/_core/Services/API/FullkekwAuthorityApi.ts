import { $http } from '~/services/HTTPService';
import { IFullkekwAuthorityAPI_TokenVerify } from '~/core/Interfaces/API/IFullkekwAuthorityAPI';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface IVerifyTokenProps {
  token: string
}



const baseURL = config.URL.fullkekw_authority;

/** @version 1.0.2 */
export class FullkekwAuthorityAPI {
  static async verifyToken(payload: IVerifyTokenProps) {
    const url = `${baseURL}/verify`;
    Logger.trace(`[FullkekwAuthorityAPI]: POST - ${url}`);

    const { data } = await $http.post<IFullkekwAuthorityAPI_TokenVerify>(url, payload);

    return data;
  }
}



export default FullkekwAuthorityAPI;