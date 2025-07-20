import { $http } from '~/services/HTTPService';
import { HikkaAnime, HikkaMALIntegration } from '~/core/interfaces/types';
import { config } from '~/config';



interface GetMALIntegrationProps {
  slug: string
}

interface GetAnimeProps {
  slug: string
}



const baseURL = config.URL.hikkaAPI;

export class Hikka {
  static async getMALIntegration({ slug }: GetMALIntegrationProps): Promise<HikkaMALIntegration> {
    const { data } = await $http.get<HikkaMALIntegration>(`${baseURL}/integrations/mal/anime/${slug}`);

    return data;
  }

  static async getAnime({ slug }: GetAnimeProps): Promise<HikkaAnime> {
    const { data } = await $http.get<HikkaAnime>(`${baseURL}/anime/${slug}`);

    return data;
  }
}