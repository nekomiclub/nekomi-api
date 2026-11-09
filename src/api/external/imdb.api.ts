import axios from 'axios';

import conf from '~/conf.js';
import { IMDBTitle } from '~/interfaces/external-api/IMDB.api.js';




interface GetSearchTitlesProps {
  query: string
}



const baseURL = conf.variables.imdb_url_api;

export class IMDBAPI {
  static async searchTitles({ query }: GetSearchTitlesProps): Promise<IMDBTitle[]> {
    const url = `${baseURL}/v2/search/titles?query=${query}`;
    // Logger.http(`[IMDB]: GET - ${url}`);

    const { data } = await axios.get<{ titles: IMDBTitle[] }>(url);

    return data.titles ?? [];
  }
}