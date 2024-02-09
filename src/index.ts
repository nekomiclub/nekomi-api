import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { devMode, testMode, env } from './config';

import https from 'https';
import http from 'http';
import cors, { CorsOptions } from 'cors';
import fs from 'fs';
import path from 'path';

import * as router from './router';
import * as handler from './handlers/v1/handlers';
import { E403, writeErrorLog } from './handlers/v1/Errors';
import Title from './Models/Title';
import ffmpeg from 'fluent-ffmpeg';
import { WebSocketServer } from 'ws';
import { listenWSS } from './controllers/v1/ws';

const hskey = devMode ? '' : fs.readFileSync('/etc/letsencrypt/live/api.animee.club/privkey.pem', 'utf8');
const hscert = devMode ? '' : fs.readFileSync('/etc/letsencrypt/live/api.animee.club/cert.pem', 'utf8');
const hschain = devMode ? '' : fs.readFileSync('/etc/letsencrypt/live/api.animee.club/chain.pem', 'utf8');

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
export const wss = devMode ? new WebSocketServer({
  host: env.IP,
  port: env.WS_PORT,
}) : new WebSocketServer({
  server: https.createServer({
    key: hskey,
    cert: hscert,
    ca: [hschain],
  }).listen(env.WS_PORT, env.IP)
});

const CORSOpt: CorsOptions = {
  origin: [
    'https://animee.club',
    'https://www.animee.club',
    'https://updater.animee.club',
    'https://auth.animee.club',
    'https://api.animee.club',
    devMode ? 'http://localhost:3000' : '',
    devMode ? 'http://192.168.0.106:3000' : '',
    'https://animee-git-dev-unniiiverse.vercel.app'
  ],
  credentials: true,
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(CORSOpt));
app.options('*', cors(CORSOpt));

app.use('/v1', router.ApiV1);
app.use('/proxy', router.ProxyRouter);


if (!devMode) {
  app.enable('trust proxy');
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }

    next();
  });

  ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
}

if (!process.env.HTTP_PORT) {
  throw new Error('PORT ENV IS NOT DEFINED');
}


function listen(https?: boolean, showDetails?: boolean, ws?: boolean) {
  if (ws) {
    console.log(`Websocket is listening on ${https ? 'wss' : 'ws'}://${env.IP}:${env.WS_PORT}`);
  } else {
    console.log(`Server is listening on ${https ? 'https://' : 'http://'}${env.IP}:${https ? env.HTTPS_PORT : env.HTTP_PORT} ...`);
  }

  if (!showDetails) return;
  console.log(`ANIMEE CORE STARTED. DETAILS:\n  - StartedAt: ${new Date(handler.getUTCTime())};\n  - Mode: ${devMode ? 'DevMode' : testMode ? 'TestMode' : 'ProdMode'}`);

  onReady();
}

wss.on('listening', () => listen(true, false, true));
wss.on('error', e => { throw e; });

if (devMode) {
  app.listen(env.HTTP_PORT, env.IP, () => listen(false, true));
} else {
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

import { sendDayStat } from './services/v1/stats';

async function onReady() {
  try {
    listenWSS();
    // handler.reuploadImages();
    // await handler.updateTitles();

    setInterval(() => {
      sendDayStat();
    }, 30000); // 30000 // 30s
  } catch (e) {
    // @ts-ignore
    writeErrorLog(`onReady cb throw an error: ${e.message || e.msg}`, 'index');
  }
}