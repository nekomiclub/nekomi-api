import Logger from './LoggerService';
import conf from '~/config';
import mongoose from 'mongoose';



const MAX_RETRY_ATTEMPS = 10;
const RETRY_TIMEOUT_MS = 5000;



class DatabaseServiceConstructor {
  private retryAttemps = 0;



  async connect() {
    mongoose.set('strictQuery', false);

    try {
      await mongoose.connect(conf.mongodbUrl, {
        retryWrites: true,
      });

      Logger.debug(`[System/DatabaseService]: Connection with MongoDB establish succeeded (${this.retryAttemps}/${MAX_RETRY_ATTEMPS})`);
    } catch (e) {
      Logger.warn(`[System/DatabaseService]: Connection failed, retrying after ${RETRY_TIMEOUT_MS}ms... (${this.retryAttemps}/${MAX_RETRY_ATTEMPS})`, e);

      setTimeout(() => {
        this.retryAttemps += 1;
        if (this.retryAttemps >= MAX_RETRY_ATTEMPS) return Logger.error(`[System/MongoDB]: Cannot establish connection with MongoDB (${this.retryAttemps}/${MAX_RETRY_ATTEMPS})`, e);

        Logger.debug(`[System/DatabaseService]: Retry establishing connect with MongoDB... (${this.retryAttemps}/${MAX_RETRY_ATTEMPS})`);

        this.connect();
      }, RETRY_TIMEOUT_MS);
    }
  }
}



const DatabaseService = new DatabaseServiceConstructor();
export default DatabaseService;