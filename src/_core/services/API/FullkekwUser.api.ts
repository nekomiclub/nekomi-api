import { $http } from '~/services/HTTPService';
import { FullkekwUser_GetUser, FullkekwUser_RefreshPayload } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { HandleAPIError } from '~/services/ErrorService';
import { config } from '~/config';



interface GetUserProps {
  id: string
}

interface RefreshAuthProps {
  sessionCookie: string
}



const baseURL = config.URL.fullkekw_userapi;
const APINAME = 'fullkekw-userapi';



/** @version 2.1.1 */
export default class FullkekwUser {
  static async getUser({ id }: GetUserProps) {
    try {
      const { data } = await $http.get<FullkekwUser_GetUser>(`${baseURL}/user/${id}`);

      return data;
    } catch (e) {
      HandleAPIError(e, APINAME);
    }
  }

  static async refreshAuth({ sessionCookie }: RefreshAuthProps) {
    try {
      const { data } = await $http.get<FullkekwUser_RefreshPayload>(`${baseURL}/auth/refresh`, {
        headers: {
          Cookie: `session=${sessionCookie}`
        }
      });

      return data;
    } catch (e) {
      HandleAPIError(e, APINAME);
    }
  }
}