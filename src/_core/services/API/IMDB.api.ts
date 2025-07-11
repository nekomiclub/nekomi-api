import axios from 'axios';
import { IMDBTitle } from '~/core/interfaces/API/IMDB.api';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface GetSearchTitlesProps {
  query: string
}



const baseURL = config.URL.imdbAPI;

export class IMDB {
  static async searchTitles({ query }: GetSearchTitlesProps): Promise<IMDBTitle[]> {
    const url = `${baseURL}/v2/search/titles?query=${query}`;
    Logger.trace(`[IMDB]: GET - ${url}`);

    const { data } = await axios.get<{ titles: IMDBTitle[] }>(url);

    return data.titles ?? [];
  }
}