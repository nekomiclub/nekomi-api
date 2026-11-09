import axios from 'axios';

import conf from '~/conf.js';
import { IMoonanime3Episode } from '~/interfaces/external-api/IMoonanime.api.js';
import env from '~/utils/env.js';



const baseURL = conf.variables.moonanime_api_url;

export class MoonanimeAPI {
  static async getEpisodes(mal_id: number): Promise<IMoonanime3Episode[]> {
    const url = `${baseURL}/3.0/episodes`;
    // Logger.http(`[MoonanimeAPI]: GET - ${url}`);

    const { data } = await axios.get<{ episodes: IMoonanime3Episode[] }>(url, {
      params: {
        id: mal_id,
        api_key: env('MOONANIME_API_SK')
      }
    });

    return data.episodes;
  }
}