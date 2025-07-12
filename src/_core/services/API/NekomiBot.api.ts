import { $http } from '~/services/HTTPService';
import { HandleAPIError } from '~/services/ErrorService';
import { NekomiBot_PostBroadcast } from '~/core/interfaces/API/NekomiBotAPI.intf';
import { config } from '~/config';



const baseURL = config.URL.nekomi_bot;
const APINAME = 'nekomi-bot';



/** @version 2.1.0 */
export class NekomiBot {
  static async broadcast(payload: NekomiBot_PostBroadcast) {
    try {
      await $http.post(`${baseURL}/broadcast`, payload);
    } catch (e) {
      HandleAPIError(e, APINAME);
    }
  }
}



export default NekomiBot;