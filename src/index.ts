import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { devMode, testMode, env } from './config';

import https from 'https';
import cors, { CorsOptions } from 'cors';
import fs from 'fs';
import path from 'path';

import * as router from './router';
import * as handler from './handlers/v1/handlers';
import { UploadQueue } from './services/v1/processMedia';
import { E403, writeErrorLog } from './handlers/v1/Errors';
import Title from './Models/Title';

//! DO NOT CHANGE IF NOT NECESSARY
export const MONGO_URI = (devMode) ? env.MONGODB_DEV_URI : env.MONGODB_PROD_URI;

mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI, {
  retryWrites: true,
}).catch(e => {
  console.error(e);
  // @ts-ignore
  writeErrorLog(`MONGODB ERROR: ${e.message}`, 'index');
});

export const app = express();

const CORSOpt: CorsOptions = {
  origin: [
    'https://animee.club',
    'https://updater.animee.club',
    'https://auth.animee.club',
    'https://api.animee.club',
    devMode ? 'http://localhost:3000' : '',
    devMode ? 'http://192.168.0.106:3000' : '',
  ],
  credentials: true,
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(CORSOpt));
app.options('*', cors(CORSOpt));
app.use('/v1', router.ApiV1);

if (!devMode) {
  app.enable('trust proxy');
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }

    next();
  });
}

if (!process.env.HTTP_PORT) {
  throw new Error('PORT ENV IS NOT DEFINED');
}

export const uploadQueue = new UploadQueue();


function listen(https?: boolean, showDetails?: boolean) {
  console.log(`Server is listening on ${https ? 'https://' : 'http://'}${env.IP}:${https ? env.HTTPS_PORT : env.HTTP_PORT} ...`);

  if (!showDetails) return;
  console.log(`DETAILS:\nStartedAt: ${new Date(handler.getUTCTime())};\nDevMode: ${devMode};\nTestMode: ${testMode};\n`);

  onReady();
}

if (devMode) {
  app.listen(env.HTTP_PORT, env.IP, () => listen(false, true));
} else {
  const hskey = fs.readFileSync('/etc/letsencrypt/live/api.animee.club/privkey.pem', 'utf8');
  const hscert = fs.readFileSync('/etc/letsencrypt/live/api.animee.club/cert.pem', 'utf8');
  const hschain = fs.readFileSync('/etc/letsencrypt/live/api.animee.club/chain.pem', 'utf8');

  if (!hskey || !hscert || !hschain) {
    throw new Error('SSL certs are not found');
  }

  app.listen(env.HTTP_PORT, env.IP, () => listen());
  https.createServer({
    key: hskey,
    cert: hscert,
    ca: [hschain]
  }, app).listen(env.HTTPS_PORT, env.IP, () => listen(true, true));
}

async function onReady() {
  try {
    // await handler.clearTestIDs();
    // await handler.updatePreviewFrames();

    setTimeout(async () => {
      await handler.clearout();
    }, 1000 * 60 * 60 * 24);
  } catch (e) {
    // @ts-ignore
    writeErrorLog(`onReady cb throw an error: ${e.message}`, 'index');
  }
}