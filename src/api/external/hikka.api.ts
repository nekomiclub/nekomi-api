import Logger from '~/service/LoggerService';
import conf from '~/config';
import { $http } from '~/service/HTTPService';
import { HikkaMALIntegration } from '~/intf/types';
import { IHikkaAnime } from '~/intf/external-api/IHikka.api';



const baseURL = conf.URL.hikkaAPI;

export class HikkaAPI {
  static async getMALIntegration(slug: string): Promise<HikkaMALIntegration> {
    const url = `${baseURL}/integrations/mal/anime/${slug}`;
    Logger.http(`[Hikka]: GET - ${url}`);

    const { data } = await $http.get<HikkaMALIntegration>(url);

    return data;
  }

  static async getAnime(slug: string): Promise<IHikkaAnime> {
    const url = `${baseURL}/anime/${slug}`;
    Logger.http(`[Hikka]: GET - ${url}`);

    const { data } = await $http.get<IHikkaAnime>(url);

    return data;
  }
}