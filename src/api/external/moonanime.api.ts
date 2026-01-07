import axios from 'axios';
import conf from '~/conf';
import { IMoonanime3Episode } from '~/intf/external-api/IMoonanime.api';



const baseURL = conf.URL.moonanimeAPI;

export class MoonanimeAPI {
  static async getEpisodes(mal_id: number): Promise<IMoonanime3Episode[]> {
    const url = `${baseURL}/3.0/episodes`;
    // Logger.http(`[MoonanimeAPI]: GET - ${url}`);

    const { data } = await axios.get<{ episodes: IMoonanime3Episode[] }>(url, {
      params: {
        id: mal_id,
        api_key: conf.env.MOONANIME_API_SK
      }
    });

    return data.episodes;
  }
}