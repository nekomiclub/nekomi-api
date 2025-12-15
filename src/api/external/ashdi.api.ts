import Logger from '~/service/LoggerService';
import axios from 'axios';
import conf from '~/config';
import { IAshdiDub, IAshdiTitle } from '~/intf/external-api/IAshdi.api';




interface GetTitleProps {
  imdbId: string
}



const baseURL = conf.URL.ashdiAPI;

export class Ashdi {
  static async getTitle({ imdbId }: GetTitleProps): Promise<IAshdiTitle> {
    const url = `${baseURL}/api/product/read_one.php?imdb=${imdbId}&api_key=${conf.env.ASHDI_API_KEY}`;
    Logger.http(`[Ashdi]: GET - ${url}`);

    const { data } = await axios.get<IAshdiTitle>(url);

    data.pl = JSON.parse(`${data.pl}`) as IAshdiDub[];

    return data;
  }
}