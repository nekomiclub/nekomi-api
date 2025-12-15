import conf from '~/config';
import { $http } from '~/service/HTTPService';
import { HikkaMALIntegration } from '~/intf/types';
import { IHikkaAnime } from '~/intf/external-api/IHikka.api';



const baseURL = conf.URL.hikkaAPI;

export class Hikka {
  static async getMALIntegration(slug: string): Promise<HikkaMALIntegration> {
    const { data } = await $http.get<HikkaMALIntegration>(`${baseURL}/integrations/mal/anime/${slug}`);

    return data;
  }

  static async getAnime(slug: string): Promise<IHikkaAnime> {
    const { data } = await $http.get<IHikkaAnime>(`${baseURL}/anime/${slug}`);

    return data;
  }
}