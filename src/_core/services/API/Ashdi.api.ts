import axios from 'axios';
import { AshdiDub, AshdiTitle } from '~/core/interfaces/API/AshdiAPI.intf';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface GetTitleProps {
  imdbId: string
}



const baseURL = config.URL.ashdiAPI;

export class Ashdi {
  static async getTitle({ imdbId }: GetTitleProps): Promise<AshdiTitle> {
    const url = `${baseURL}/api/product/read_one.php?imdb=${imdbId}&api_key=${config.env.ASHDI_API_KEY}`;
    Logger.trace(`[Ashdi]: GET - ${url}`);

    const { data } = await axios.get<AshdiTitle>(url);

    data.pl = JSON.parse(`${data.pl}`) as AshdiDub[];

    return data;
  }
}