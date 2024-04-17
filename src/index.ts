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
import { sendDayStat } from './services/v1/stats';

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
    devMode ? 'http://localhost:3001' : '',
    devMode ? 'http://localhost:3000' : '',
    devMode ? 'http://192.168.0.106:3001' : '',
    devMode ? 'http://192.168.0.106:3000' : '',
    'https://animee-git-dev-unniiiverse.vercel.app'
  ],
  credentials: true,
};

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors(CORSOpt));
app.options('*', cors(CORSOpt));

app.use('/v1', router.ApiV1);
app.use('/proxy', router.ProxyRouter);



if (prodMode) {
  app.enable('trust proxy');
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }

    next();
  });

  ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
}

if (devMode) {
  app.use('/dev', router.DevRouter);
}



function listen(https?: boolean, showDetails?: boolean) {
  if (!showDetails) return;
  console.log(`
    -------------------

    ANIMEE-API STARTED

    At: ${handler.getUTC().date} UTC0 ${handler.getUTC().time}
    Mode: ${prodMode ? 'ProdMode' : 'DevMode'} ${testMode ? '+ test mode' : ''}
    HTTP: ${config.service.HOST}:${config.service.PORTS.HTTP} ${devMode ? '(changed default, see config.ts)' : ''}
    HTTPS: ${prodMode ? 'NGINX serve' : 'Disabled in dev mode'}
    WS: ${config.service.HOST}:${config.service.PORTS.WS}
    
    -------------------
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

async function onReady() {
  try {
    listenWSS();

    if (prodMode) {
      // Modify only on production mode
      //! WILL SET EVERYONE ROLES TO "user". MUST BE DELETED IN ZERO-DAY PATCH
      await handler.modifyUsers();

      // Create basic roles
      await handler.createRoles();
    }


    await sendDayStat();
  } catch (e) {
    // @ts-ignore
    writeErrorLog(`onReady cb throw an error: ${e.message || e.msg}`, 'index');
  }
}