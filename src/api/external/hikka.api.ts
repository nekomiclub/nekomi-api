import conf from '~/conf.js';
import { IHikkaAnime , IHikkaMALIntegration } from '~/interfaces/external-api/IHikka.api.js';
import { $http } from '~/utils/http-utils.js';



const baseURL = conf.variables.hikka_api_url;

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