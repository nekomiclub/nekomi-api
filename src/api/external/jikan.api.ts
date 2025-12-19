import Logger from '~/service/LoggerService';
import axios from 'axios';
import conf from '~/config';
import { IJikanAnime, IJikanAnimeEpisodeMeta } from '~/intf/external-api/IJikan.api';



interface IJikanGetAnime {
  data: IJikanAnime
}

interface IJikanGetAnimeEpisodes {
  pagination: {
    last_visible_page: number
    has_next_page: boolean
  }
  data: IJikanAnimeEpisodeMeta[]
}



const baseURL = conf.URL.jikanAPI;

export class JikanAPI {
  static async getAnime(malId: number): Promise<IJikanAnime> {
    const url = `${baseURL}/v4/anime/${malId}/full`;
    Logger.http(`[Jikan]: GET - ${url}`);

    const { data } = await axios.get<IJikanGetAnime>(url);

    return data.data;
  }

  static async getAnimeEpisodeMeta(malId: number): Promise<IJikanAnimeEpisodeMeta[]> {
    const url = `${baseURL}/v4/anime/${malId}/episodes`;
    Logger.http(`[Jikan]: GET - ${url}`);

    const { data } = await axios.get<IJikanGetAnimeEpisodes>(url);

    return data.data;
  }
}