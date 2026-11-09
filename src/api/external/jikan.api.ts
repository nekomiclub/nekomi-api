import axios from 'axios';

import conf from '~/conf.js';
import { IJikanAnime, IJikanAnimeEpisode } from '~/interfaces/external-api/IJikan.api.js';



interface IJikanGetAnime {
  data: IJikanAnime
}

interface IJikanGetAnimeEpisodes {
  pagination: {
    last_visible_page: number
    has_next_page: boolean
  }
  data: IJikanAnimeEpisode[]
}



const baseURL = conf.variables.jikan_api_url;

export class JikanAPI {
  static async getAnime(malId: number): Promise<IJikanAnime> {
    const url = `${baseURL}/v4/anime/${malId}/full`;
    // Logger.http(`[Jikan]: GET - ${url}`);

    const { data } = await axios.get<IJikanGetAnime>(url);

    return data.data;
  }

  static async getAnimeEpisodeMeta(malId: number): Promise<IJikanAnimeEpisode[]> {
    const url = `${baseURL}/v4/anime/${malId}/episodes`;
    // Logger.http(`[Jikan]: GET - ${url}`);

    // TODO: Implement pagination
    const { data } = await axios.get<IJikanGetAnimeEpisodes>(url);

    return data.data;
  }
}