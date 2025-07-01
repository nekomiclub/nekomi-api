import axios from 'axios';
import { HikkaAnime, HikkaMALIntegration } from '~/core/interfaces/types';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface GetMALIntegrationProps {
  slug: string
}

interface GetAnimeProps {
  slug: string
}



const baseURL = config.URL.hikkaAPI;

export class Hikka {
  /** Fetch myanimelist integration */
  static async getMALIntegration({ slug }: GetMALIntegrationProps): Promise<HikkaMALIntegration> {
    const url = `${baseURL}/integrations/mal/anime/${slug}`;
    Logger.trace(`[Hikka]: GET - ${url}`);

    const { data } = await axios.get<HikkaMALIntegration>(url);

    return data;
  }

  /** Get anime */
  static async getAnime({ slug }: GetAnimeProps): Promise<HikkaAnime> {
    const url = `${baseURL}/anime/${slug}`;
    Logger.trace(`[Hikka]: GET - ${url}`);

    const { data } = await axios.get<HikkaAnime>(url);

    return data;
  }
}