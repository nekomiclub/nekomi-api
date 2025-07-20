import axios from 'axios';
import { IJikanAnimeEpisodeMeta } from '~/core/interfaces/API/JikanAPI.intf';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface IGetAnimeEpisodeMetaProps {
  malId: number
}

interface IJikanAnimeEpisodeMetaRes {
  pagination: {
    last_visible_page: number
    has_next_page: boolean
  }
  data: IJikanAnimeEpisodeMeta[]
}



const baseURL = config.URL.jikanAPI;

export class Jikan {
  static async getAnimeEpisodeMeta({ malId }: IGetAnimeEpisodeMetaProps): Promise<IJikanAnimeEpisodeMeta[]> {
    const url = `${baseURL}/v4/anime/${malId}/episodes`;
    Logger.trace(`[Jikan]: GET - ${url}`);

    const { data } = await axios.get<IJikanAnimeEpisodeMetaRes>(url);

    return data.data;
  }
}