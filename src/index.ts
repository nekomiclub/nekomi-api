import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { devMode, testMode, config, prodMode } from './config';

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

const hskey = devMode ? '' : fs.readFileSync('/etc/letsencrypt/live/animee.club/privkey.pem', 'utf8');
const hscert = devMode ? '' : fs.readFileSync('/etc/letsencrypt/live/animee.club/cert.pem', 'utf8');
const hschain = devMode ? '' : fs.readFileSync('/etc/letsencrypt/live/animee.club/fullchain.pem', 'utf8');

//! DO NOT CHANGE IF NOT NECESSARY
const MONGO_URI = `mongodb://${prodMode ? `${config.service.DB!.PROD.USR}:${config.service.DB!.PROD.PWD}` : `${config.service.DB!.DEV.USR}:${config.service.DB!.DEV.PWD}`}@${config.db.HOST}:${config.db.PORT}/${prodMode ? config.service.DB!.PROD.DB_NAME : config.service.DB!.DEV.DB_NAME}`;

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
  host: config.service.HOST,
  port: config.service.PORTS.WS!,
}) : new WebSocketServer({
  server: https.createServer({
    key: hskey,
    cert: hscert,
    ca: [hschain],
  }).listen(config.service.PORTS.WS!, config.service.HOST)
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

function listen(https?: boolean, showDetails?: boolean) {
  if (!showDetails) return;
  console.log(`
  --------------------------------------------
  ANIMEE-CORE STARTED:
  -  Mode: ${prodMode ? 'ProdMode' : devMode ? 'DevMode' : testMode ? 'TestMode' : 'Mode is unknown'}
  -  HTTP: ${config.service.HOST}:${config.service.PORTS.HTTP!} ${devMode ? 'Changed from 43080. Details - config.ts.' : ''} 
  ${https ? `-  HTTPS: ${config.service.HOST}:${config.service.PORTS.HTTPS}` : `-  HTTPS: Disabled`} 
  -  WS: ${config.service.HOST}:${config.service.PORTS.WS}
  --------------------------------------------
  `);

  onReady();
}

wss.on('listening', () => listen(true, false));
wss.on('error', e => { throw e; });

if (devMode) {
  app.listen(config.service.PORTS.HTTP!, config.service.HOST, () => listen(false, true));
} else {
  if (!hskey || !hscert || !hschain) {
    throw new Error('SSL certs are not found');
  }

  app.listen(config.service.PORTS.HTTP!, config.service.HOST, () => listen());
  https.createServer({
    key: hskey,
    cert: hscert,
    ca: [hschain]
  }, app).listen(config.service.PORTS.HTTPS!, config.service.HOST, () => listen(true, true));
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