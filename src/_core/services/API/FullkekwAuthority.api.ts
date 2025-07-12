import { $http } from '~/services/HTTPService';
import { FullkekwAuthority_TokenVerify } from '~/core/interfaces/API/FullkekwAuthorityAPI.intf';
import { HandleAPIError } from '~/services/ErrorService';
import { config } from '~/config';



interface VerifyTokenProps {
  token: string
}



const baseURL = config.URL.fullkekw_authority;
const APINAME = 'fullkekw-authority';



/** @version 2.1.1 */
export class FullkekwAuthority {
  static async verifyToken(payload: VerifyTokenProps) {
    try {
      const { data } = await $http.post<FullkekwAuthority_TokenVerify>(`${baseURL}/verify`, payload);

      return data;
    } catch (e) {
      HandleAPIError(e, APINAME);
    }
  }
}



export default FullkekwAuthority;