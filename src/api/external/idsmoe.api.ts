import axios from 'axios';
import conf from '~/conf.js';
import { IdsMoeKeys } from '~/interfaces/external-api/IdsMoe.api.js';



const baseURL = conf.URL.idsmoeAPI;

export class IdsMoeAPI {
  static async getIds(malId: number): Promise<IdsMoeKeys> {
    const url = `${baseURL}/ids/${malId}`;
    // Logger.http(`[IdsMoe]: GET - ${url}`);

    const { data } = await axios.get<IdsMoeKeys>(url, {
      headers: {
        'Authorization': `Bearer ${conf.env.IDS_MOE_SK}`
      }
    });

    return data;
  }
}