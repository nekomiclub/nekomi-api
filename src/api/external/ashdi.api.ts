import axios from 'axios';
import conf from '~/conf.js';
import env from '~/utils/env.js';
import { IAshdiTeam, IAshdiTitle } from '~/interfaces/external-api/IAshdi.api.js';



const baseURL = conf.variables.ashdi_api_url;

export class AshdiAPI {
  static async getTitle(imdbId: string): Promise<IAshdiTitle> {
    const url = `${baseURL}/product/read_one.php`;
    // Logger.http(`[Ashdi]: GET - ${url}`);

    const { data } = await axios.get<IAshdiTitle>(url, {
      params: {
        imdb: imdbId,
        api_key: env('ASHDI_API_SK')
      }
    });

    data.pl = JSON.parse(`${data.pl}`) as IAshdiTeam[];

    return data;
  }
}