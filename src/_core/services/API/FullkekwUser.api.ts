import { $http } from '~/services/HTTPService';
import { FullkekwUserAPI_GetUser, FullkekwUserAPI_RefreshPayload } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { HandleAPIErorr } from '~/services/ErrorService';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface GetUserProps {
  id: string
}

interface RefreshAuthProps {
  sessionCookie: string
}



const baseURL = config.URL.fullkekw_usapi;
const APINAME = 'fullkekw-userapi';



/** @version 2.1.1 */
export default class FullkekwUserAPI {
  static async getUser({ id }: GetUserProps) {
    try {
      const url = `${baseURL}/user/${id}`;
      Logger.trace(`[FullkekwUserAPI]: GET - ${url.replace(baseURL, '')}`);

      const { data } = await $http.get<FullkekwUserAPI_GetUser>(url);

      return data;
    } catch (e) {
      HandleAPIErorr(e, APINAME);
    }
  }

  static async refreshAuth({ sessionCookie }: RefreshAuthProps) {
    try {
      const url = `${baseURL}/auth/refresh`;
      Logger.trace(`[FullkekwUserAPI]: GET - ${url.replace(baseURL, '')}`);


      const { data } = await $http.get<FullkekwUserAPI_RefreshPayload>(url, {
        headers: {
          Cookie: `session=${sessionCookie}`
        }
      });

      return data;
    } catch (e) {
      HandleAPIErorr(e, APINAME);
    }
  }
}