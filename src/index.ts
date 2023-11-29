import dotenv from 'dotenv';
import { IEnv } from './env';

dotenv.config();

// @ts-expect-error abc
const env = process.env as IEnv;

import express from 'express';
import mongoose from 'mongoose';

import * as router from './router';

mongoose.set('strictQuery', false);
mongoose.connect(env.MONGODBURI);

export const app = express();

app.use(express.json({ limit: '1gb' }));
app.use('/v1', router.ApiV1);


if (!process.env.PORT) {
  throw new Error('PORT ENV IS NOT DEFINED');
}

app.listen(env.PORT, String(env.IP), () => {
  console.log(`Server is listening on ${env.IP}:${env.PORT} ...`);
});