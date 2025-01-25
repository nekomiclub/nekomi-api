import { $http } from '~/services/HTTPService';
import { IFullkekwUserAPI_GetUser, IFullkekwUserAPI_TokenData } from '~/core/Interfaces/API/IFullkekwUserAPI';
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
    Logger.trace(`[FullkekwAuthorityAPI]: GET - ${url}`);

    const { data } = await $http.get<IFullkekwUserAPI_GetUser>(url);

    return data;
  }

  static async refreshAuth({ sessionCookie }: IRefreshAuthProps) {
    const url = `${baseURL}/auth/refresh`;
    Logger.trace(`[FullkekwAuthorityAPI]: GET - ${url}`);


    const { data } = await $http.get<IFullkekwUserAPI_TokenData>(url, {
      headers: {
        Cookie: `session=${sessionCookie}`
      }
    });

    return data;
  }
}