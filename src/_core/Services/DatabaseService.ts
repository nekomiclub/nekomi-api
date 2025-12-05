import log from './LoggerService';
import mongoose from 'mongoose';
import { conf } from '~/config';



const MAX_RETRY_ATTEMPS = 5;
const RETRY_TIMEOUT_MS = 2000;



class MongoDBServiceConstructor {
  private retryAttemps = 0;



  async connect() {
    mongoose.set('strictQuery', false);

    await mongoose.connect(conf.mongodbUrl, {
      retryWrites: true,
    }).then(() => log.info(`[System/MongoDB]: Connection with MongoDB establish succeeded (${this.retryAttemps}/${MAX_RETRY_ATTEMPS})`)).catch(e => {
      log.warn(`[System/MongoDB]: Connection failed, retrying after ${RETRY_TIMEOUT_MS}ms... (${this.retryAttemps}/${MAX_RETRY_ATTEMPS})`, e);

      setTimeout(() => {
        this.retryAttemps += 1;
        if (this.retryAttemps >= MAX_RETRY_ATTEMPS) return log.error(`[System/MongoDB]: Cannot establish connection with MongoDB (${this.retryAttemps}/${MAX_RETRY_ATTEMPS})`, e);

        log.debug(`[System/MongoDB]: Retry establishing connect with MongoDB... (${this.retryAttemps}/${MAX_RETRY_ATTEMPS})`);

        this.connect();
      }, RETRY_TIMEOUT_MS);
    });
  }
}



const MongoDBService = new MongoDBServiceConstructor();
export default MongoDBService;