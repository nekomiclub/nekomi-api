import { $http } from '~/services/HTTPService';
import { INotifyBroadcast } from '~/interfaces/services/Notify';
import { config } from '~/config';



const baseURL = config.URL.nekomi_bot;

/** @version 1.3.2 */
export class NekomiBotAPI {
  static async broadcast(payload: INotifyBroadcast<any, any>) {
    await $http.post(`${baseURL}/broadcast`, payload);
  }
}



export default NekomiBotAPI;