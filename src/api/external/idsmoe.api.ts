import Logger from '~/service/LoggerService';
import axios from 'axios';
import conf from '~/conf';
import { IdsMoeKeys } from '~/intf/external-api/IdsMoe.api';



const baseURL = conf.URL.idsmoeAPI;

export class IdsMoeAPI {
  static async getIds(malId: number): Promise<IdsMoeKeys> {
    const url = `${baseURL}/ids/${malId}`;
    Logger.http(`[IdsMoe]: GET - ${url}`);

    const { data } = await axios.get<IdsMoeKeys>(url, {
      headers: {
        'Authorization': `Bearer ${conf.env.IDS_MOE_SK}`
      }
    });

    return data;
  }
}