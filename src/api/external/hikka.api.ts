import conf from '~/conf';
import { $http } from '~/utils/http-utils';
import { IHikkaAnime } from '~/intf/external-api/IHikka.api';
import { IHikkaMALIntegration } from '~/intf/external-api/IHikka.api';



const baseURL = conf.URL.hikkaAPI;

export class HikkaAPI {
  static async getMALIntegration(slug: string): Promise<IHikkaMALIntegration> {
    const url = `${baseURL}/integrations/mal/anime/${slug}`;
    // Logger.http(`[Hikka]: GET - ${url}`);

    const { data } = await $http.get<IHikkaMALIntegration>(url);

    return data;
  }

  static async getAnime(slug: string): Promise<IHikkaAnime> {
    const url = `${baseURL}/anime/${slug}`;
    // Logger.http(`[Hikka]: GET - ${url}`);

    const { data } = await $http.get<IHikkaAnime>(url);

    return data;
  }
}