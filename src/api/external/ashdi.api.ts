import axios from 'axios';
import conf from '~/conf.js';
import { IAshdiTeam, IAshdiTitle } from '~/intf/external-api/IAshdi.api.js';



const baseURL = conf.URL.ashdiAPI;

export class AshdiAPI {
  static async getTitle(imdbId: string): Promise<IAshdiTitle> {
    const url = `${baseURL}/product/read_one.php`;
    // Logger.http(`[Ashdi]: GET - ${url}`);

    const { data } = await axios.get<IAshdiTitle>(url, {
      params: {
        imdb: imdbId,
        api_key: conf.env.ASHDI_API_SK
      }
    });

    data.pl = JSON.parse(`${data.pl}`) as IAshdiTeam[];

    return data;
  }
}