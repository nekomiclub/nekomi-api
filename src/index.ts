import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { devMode, testMode, env } from './config';

import * as router from './router';
import * as handler from './handlers/v1/handlers';
import { Dubbers } from './Models/Dubber';
import * as uuid from 'uuid';
import cors from 'cors';
import { UploadQueue } from './services/v1/processMedia';
import https from 'https';

import fs from 'fs';
import { E403, writeErrorLog } from './handlers/v1/Errors';

handler.createInitArchitecture();


mongoose.set('strictQuery', false);
mongoose.connect((devMode) ? env.MONGODB_DEV_URI : env.MONGODB_PROD_URI, {
  // ssl: true,
  retryWrites: true,
}).catch(e => {
  console.error(e);
  // @ts-ignore
  writeErrorLog(`MONGODB ERROR: ${e.message}`, 'index');
});

export const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
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
  console.log(`DETAILS:\nStartedAt: ${new Date()};\nDevMode: ${devMode};\nTestMode: ${testMode};\n`);

  onReady();
}

if (devMode) {
  app.listen(env.HTTP_PORT, env.IP, () => listen(false, true));
} else {
  const hskey = fs.readFileSync('/etc/letsencrypt/live/api.animee.club/privkey.pem', 'utf8');
  const hscert = fs.readFileSync('/etc/letsencrypt/live/api.animee.club/cert.pem', 'utf8');
  const hschain = fs.readFileSync('/etc/letsencrypt/live/api.animee.club/chain.pem', 'utf8');

  app.listen(env.HTTP_PORT, env.IP, () => listen());
  https.createServer({
    key: hskey,
    cert: hscert,
    ca: [hschain]
  }, app).listen(env.HTTPS_PORT, env.IP, () => listen(true, true));
}

async function onReady() {
  await handler.clearTestIDs();
  // handler.createDubbers();
}