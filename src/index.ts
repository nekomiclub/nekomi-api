import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { devMode, testMode, env } from './config';

import * as router from './router';
import { createInitArchitecture, clearTestIDs } from './handlers/v1/handlers';
import { Dubbers } from './Models/Dubber';
import * as uuid from 'uuid';

createInitArchitecture();


mongoose.set('strictQuery', false);
mongoose.connect((devMode) ? env.MONGODB_DEV_URI : env.MONGODB_PROD_URI);

export const app = express();

app.use(bodyParser.json());
app.use('/v1', router.ApiV1);

if (!process.env.PORT) {
  throw new Error('PORT ENV IS NOT DEFINED');
}

clearTestIDs();

// (async function () {
//   const dubber = new Dubbers({
//     id: uuid.v4(),
//     code: 'didko-studio',
//     name: 'Didko Studio',
//     thumbURL: 'http://192.168.0.106:54320/v1/media/6421d1cf-5e6e-43b4-9879-6753652d71bf'
//   });
// });

app.listen(env.PORT, String(env.IP), () => {
  console.log(`Server is listening on ${env.IP}:${env.PORT} ...`);
  console.log(`DETAILS:\nStartedAt: ${new Date()};\nDevMode: ${devMode};\nTestMode: ${testMode};\n`);
});