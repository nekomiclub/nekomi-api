import { $http } from '~/services/HTTPService';
import { FullkekwUserAPI_GetUser, FullkekwUserAPI_TokenData } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface IGetUserProps {
  id: string
}

interface IRefreshAuthProps {
  sessionCookie: string
}



const baseURL = config.URL.fullkekw_usapi;

/** @version 2.0.0 */
export default class FullkekwUserAPI {
  static async getUser({ id }: IGetUserProps) {
    const url = `${baseURL}/user/${id}`;
    Logger.trace(`[FullkekwUserAPI]: GET - ${url.replace(baseURL, '')}`);

    const { data } = await $http.get<FullkekwUserAPI_GetUser>(url);

    return data;
  }

  static async refreshAuth({ sessionCookie }: IRefreshAuthProps) {
    const url = `${baseURL}/auth/refresh`;
    Logger.trace(`[FullkekwUserAPI]: GET - ${url.replace(baseURL, '')}`);


    const { data } = await $http.get<FullkekwUserAPI_TokenData>(url, {
      headers: {
        Cookie: `session=${sessionCookie}`
      }
    });

    return data;
  }
}