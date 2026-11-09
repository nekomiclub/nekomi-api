import mongoose from 'mongoose';
import ms from 'ms';

import conf from '~/conf.js';

import Logger from './LoggerService.js';



const MAX_RETRY_ATTEMPS = 10;
const RETRY_TIMEOUT_MS = ms('5sec');



class DatabaseServiceConstructor {
  private _retryAttemps = 0;



  async connect() {
    mongoose.set('strictQuery', false);

    try {
      await mongoose.connect(conf.mongodb_uri, {
        retryWrites: true,
      });

      Logger.debug(`[System/DatabaseService]: Connection with MongoDB establish succeeded (${this._retryAttemps}/${MAX_RETRY_ATTEMPS})`);
    } catch (e) {
      Logger.warn(`[System/DatabaseService]: Connection failed, retrying after ${RETRY_TIMEOUT_MS}ms... (${this._retryAttemps}/${MAX_RETRY_ATTEMPS})`, e);

      setTimeout(() => {
        this._retryAttemps += 1;
        if (this._retryAttemps >= MAX_RETRY_ATTEMPS) return Logger.error(`[System/MongoDB]: Cannot establish connection with MongoDB (${this._retryAttemps}/${MAX_RETRY_ATTEMPS})`, e);

        Logger.debug(`[System/DatabaseService]: Retry establishing connect with MongoDB... (${this._retryAttemps}/${MAX_RETRY_ATTEMPS})`);

        this.connect();
      }, RETRY_TIMEOUT_MS);
    }
  }
}



const DatabaseService = new DatabaseServiceConstructor();
export default DatabaseService;