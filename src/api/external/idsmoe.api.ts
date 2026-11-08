import axios from 'axios';
import conf from '~/conf.js';
import env from '~/utils/env.js';
import { IdsMoeKeys } from '~/interfaces/external-api/IdsMoe.api.js';



const baseURL = conf.variables.idsmoe_api_url;

export class IdsMoeAPI {
  static async getIds(malId: number): Promise<IdsMoeKeys> {
    const url = `${baseURL}/ids/${malId}`;
    // Logger.http(`[IdsMoe]: GET - ${url}`);

    const { data } = await axios.get<IdsMoeKeys>(url, {
      headers: {
        'Authorization': `Bearer ${env('IDS_MOE_SK')}`
      }
    });

    return data;
  }
}