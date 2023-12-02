import dotenv from 'dotenv';
import { IEnv } from './env';

dotenv.config();

// @ts-ignore
const env = process.env as IEnv;
const devMode = process.argv.some(el => el === 'devMode');

import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

import * as router from './router';
import { createInitArchitecture } from './handlers/v1/handlers';

createInitArchitecture();


mongoose.set('strictQuery', false);
mongoose.connect((devMode) ? env.MONGODB_DEV_URI : env.MONGODB_PROD_URI);

export const app = express();

app.use(bodyParser.json());
app.use('/v1', router.ApiV1);


if (!process.env.PORT) {
  throw new Error('PORT ENV IS NOT DEFINED');
}

app.listen(env.PORT, String(env.IP), () => {
  console.log(`Server is listening on ${env.IP}:${env.PORT} ...`);
});