import axios from 'axios';
import conf from '~/conf.js';
import { IShikimoriAnime } from '~/interfaces/external-api/IShikimori.api.js';



const baseURL = conf.URL.shikimoriAPi;

export class ShikimoriAPI {
  static async getAnime(malId: number): Promise<IShikimoriAnime> {
    const url = `${baseURL}/animes/${malId}`;
    // Logger.http(`[Shikimori]: GET - ${url}`);

    const { data } = await axios.get<IShikimoriAnime>(url);

    return data;
  }
}