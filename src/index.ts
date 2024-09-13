import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';
import https from 'https';
import http from 'http';
import cors, { CorsOptions } from 'cors';
import fs from 'fs';
import path from 'path';
import ip from 'ip';
import process from 'process';

import { devMode, testMode, config, prodMode, checkFilesystem } from './config';

import * as router from './router';
import * as handler from './handlers/handlers';
import { E403, writeLog } from './handlers/Errors';
import Title, { TitlePatcher } from './Models/Title';
import { createUser } from './Models/User';
import { singCSRFToken } from './services/TokenService';
import { ITitleEpisode } from './interfaces/Title';
import { updateSearch } from './controllers/root';
import { WebSocketListen } from './controllers/webSocket';
import { UpdatePopularTitles } from './controllers/title';
import { INotifyNewEpisode, NotifyService } from './services/NotifyService';
import { LoggerService } from './services/LoggerService';




if (prodMode && ip.address() !== config.vars.prodIP) {
  writeLog('fatal', `Startup denied for ${ip.address()}.`, 'initialization');
  throw new Error(`
    ----------------------------
    ANIMEE-CORE STARTUP DENIED

    Current IP (${ip.address()}) has no permission to startup at production mode.
    ----------------------------
  `);
}



const hskey = prodMode ? fs.readFileSync('/etc/letsencrypt/live/animee.club/privkey.pem', 'utf8') : '';
const hscert = prodMode ? fs.readFileSync('/etc/letsencrypt/live/animee.club/cert.pem', 'utf8') : '';
const hschain = prodMode ? fs.readFileSync('/etc/letsencrypt/live/animee.club/fullchain.pem', 'utf8') : '';

//! DO NOT CHANGE IF NOT NECESSARY
const MONGO_URI = `mongodb://${prodMode ? `${config.service.DB!.PROD.USR}:${config.service.DB!.PROD.PWD}` : `${config.service.DB!.DEV.USR}:${config.service.DB!.DEV.PWD}`}@${config.db.HOST}:${config.db.PORT}/${prodMode ? config.service.DB!.PROD.DB_NAME : config.service.DB!.DEV.DB_NAME}`;

mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI, {
  retryWrites: true,
}).catch(e => {
  writeLog('fatal', e, 'initialization/mongoose');
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

if (testMode) {
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    writeLog('debug', `Request - ${req.method} ${req.url}`, 'TESTING');

    next();
  });
}

app.use('/dubber', router.DubberRouter);
app.use('/user', router.UserRouter);
app.use('/title', router.TitleRouter);

app.use('/', router.RootRouter);

if (devMode) {
  app.use('/dev', router.DevRouter);
}

wss.on('error', e => { writeLog('error', e, 'initialization/websocket'); });

/** Implementation of NotifyService */
export const Notify = new NotifyService();
export const Logger = new LoggerService();



(async function () {
  // Pre-init callback
  try {
    await checkFilesystem();
    WebSocketListen();
  } catch (e) {
    writeLog('fatal', e, 'initialization/preInit');
  }

  app.listen(config.service.PORTS.HTTP, config.service.HOST, () => {
    console.log(`
      ----------------------------
      ANIMEE-CORE STARTED UP
    
      Date: ${handler.getUTC().date} UTC0 ${handler.getUTC().time}
      Mode: ${prodMode ? 'Production' : 'Development'} ${testMode ? '(Testing)' : ''}
      HTTP: ${config.service.HOST}:${config.service.PORTS.HTTP} ${devMode ? '(changed default, see config.ts)' : ''}
      HTTPS: ${prodMode ? 'NGINX serve' : 'Disabled in dev mode'}
      WS: ${config.service.HOST}:${config.service.PORTS.WS}
      ----------------------------
    `);
  });

  // Post-init callback
  try {
    await Promise.all([
      await updateSearch(),
      await UpdatePopularTitles(),
      await handler.removeUsersLinkTelegramToken(),
    ]);

    if (prodMode) {
      await handler.updateDubbers();
    }

    setInterval(async () => {
      // Update cache
      await Promise.all([
        await updateSearch(),
        await UpdatePopularTitles(),
        await handler.removeUsersLinkTelegramToken(),
      ]);
    }, 43200000); // 43200000 // 12h
  } catch (e) {
    writeLog('error', e, 'initialization/postInit');
  }
})();
