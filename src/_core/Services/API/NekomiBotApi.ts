import { $http } from '~/services/HTTPService';
import { INekomiBot_PostBroadcast } from '~/core/Interfaces/API/INekomiBotAPI';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



const baseURL = config.URL.nekomi_bot;

/** @version 2.0.3 */
export class NekomiBotAPI {
  static async broadcast(payload: INekomiBot_PostBroadcast) {
    const url = `${baseURL}/broadcast`;
    Logger.trace(`[NekomiBotAPI]: POST - ${url}`);

    await $http.post(url, payload);
  }
}



export default NekomiBotAPI;