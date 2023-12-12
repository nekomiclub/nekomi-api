import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { devMode, testMode, env } from './config';

import * as router from './router';
import * as handler from './handlers/v1/handlers';
import { Dubbers } from './Models/Dubber';
import * as uuid from 'uuid';
import cors from 'cors';
import { UploadQueue } from './services/v1/processMedia';
import https from 'https';

import fs from 'fs';
import path from 'path';
const privateKey = fs.readFileSync(`${path.resolve()}/ssl/privatekey.pem`);
const certificate = fs.readFileSync(`${path.resolve()}/ssl/certificate.pem`);

handler.createInitArchitecture();


mongoose.set('strictQuery', false);
mongoose.connect((devMode) ? env.MONGODB_DEV_URI : env.MONGODB_PROD_URI);

export const app = express();

app.use(bodyParser.json());
app.use(cors({}));
app.use('/v1', router.ApiV1);

if (!process.env.PORT) {
  throw new Error('PORT ENV IS NOT DEFINED');
}

export const uploadQueue = new UploadQueue();



https.createServer({
  key: privateKey,
  cert: certificate
}, app).listen(env.PORT, env.IP, () => {
  console.log(`Server is listening on ${env.IP}:${env.PORT} ...`);
  console.log(`DETAILS:\nStartedAt: ${new Date()};\nDevMode: ${devMode};\nTestMode: ${testMode};\n`);

  onReady();
});



async function onReady() {
  // await handler.clearTestIDs();
  // handler.createDubbers();
}