import { $http } from '~/services/HTTPService';
import { IFullkekwAuthorityAPI_TokenVerify } from '~/core/Interfaces/API/IFullkekwAuthorityAPI';
import { config } from '~/config';



interface IVerifyTokenProps {
  token: string
}



const baseURL = config.URL.fullkekw_authority;

/** @version 1.3.2 */
export class FullkekwAuthorityAPI {
  static async verifyToken({ token }: IVerifyTokenProps) {
    const { data } = await $http.post<IFullkekwAuthorityAPI_TokenVerify>(`${baseURL}/verify`, {
      token
    });

    return data;
  }
}



export default FullkekwAuthorityAPI;