import Logger from '~/service/LoggerService';
import axios from 'axios';
import conf from '~/config';
import { IMDBTitle } from '~/intf/external-api/IMDB.api';




interface GetSearchTitlesProps {
  query: string
}



const baseURL = conf.URL.imdbAPI;

export class IMDBAPI {
  static async searchTitles({ query }: GetSearchTitlesProps): Promise<IMDBTitle[]> {
    const url = `${baseURL}/v2/search/titles?query=${query}`;
    Logger.http(`[IMDB]: GET - ${url}`);

    const { data } = await axios.get<{ titles: IMDBTitle[] }>(url);

    return data.titles ?? [];
  }
}