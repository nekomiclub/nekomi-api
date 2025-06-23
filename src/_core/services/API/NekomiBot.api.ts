import { $http } from '~/services/HTTPService';
import { HandleAPIErorr } from '~/services/ErrorService';
import { Logger } from '~/services/LoggerService';
import { NekomiBot_PostBroadcast } from '~/core/interfaces/API/NekomiBotAPI.intf';
import { config } from '~/config';



const baseURL = config.URL.nekomi_bot;
const APINAME = 'nekomi-bot';



/** @version 2.1.0 */
export class NekomiBotAPI {
  static async broadcast(payload: NekomiBot_PostBroadcast) {
    try {
      const url = `${baseURL}/broadcast`;
      Logger.trace(`[NekomiBotAPI]: POST - ${url.replace(baseURL, '')}`);

      await $http.post(url, payload);
    } catch (e) {
      HandleAPIErorr(e, APINAME);
    }
  }
}



export default NekomiBotAPI;