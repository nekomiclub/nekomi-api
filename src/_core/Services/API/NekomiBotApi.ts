import { $http } from '~/services/HTTPService';
import { Logger } from '~/services/LoggerService';
import { NekomiBot_PostBroadcast } from '~/core/interfaces/API/NekomiBotAPI.intf';
import { config } from '~/config';



const baseURL = config.URL.nekomi_bot;

/** @version 2.0.3 */
export class NekomiBotAPI {
  static async broadcast(payload: NekomiBot_PostBroadcast) {
    const url = `${baseURL}/broadcast`;
    Logger.trace(`[NekomiBotAPI]: POST - ${url.replace(baseURL, '')}`);

    await $http.post(url, payload);
  }
}



export default NekomiBotAPI;