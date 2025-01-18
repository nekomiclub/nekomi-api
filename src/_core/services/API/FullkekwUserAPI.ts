import { $http } from '~/services/HTTPService';
import { IFullkekwUserAPI_TokenData } from '~/core/Interfaces/API/IFullkekwUserAPI';
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
    const { data } = await $http.get<{
      user: {
        id: string
        username: string
        email: string
        avatarURL: string
      }
    }>(`${baseURL}/user/${id}`);

    return data;
  }

  static async refreshAuth({ sessionCookie }: IRefreshAuthProps) {
    const { data } = await $http.get<IFullkekwUserAPI_TokenData>(`${baseURL}/auth/refresh`, {
      headers: {
        Cookie: `session=${sessionCookie}`
      }
    });

    return data;
  }
}