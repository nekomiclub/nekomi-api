import mongoose from 'mongoose';
import { config } from './config';



//* Establish mongodb connection
mongoose.set('strictQuery', false);
mongoose.connect(config.mongodbUrl, {
  retryWrites: true,
}).catch(e => {
  // Logger.fail('[System]: MongoDB connection failed', e);
});