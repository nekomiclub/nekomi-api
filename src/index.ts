import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';
import https from 'https';
import http from 'http';
import cors, { CorsOptions } from 'cors';
import fs from 'fs';
import path, { resolve } from 'path';
import ip from 'ip';
import process from 'process';
import chalk from 'chalk';

import { devMode, testMode, config, prodMode } from './config';

import * as router from './router';
import * as handler from './handlers/handlers';
import Title, { TitlePatcher } from './Models/Title';
import { createUser } from './Models/User';
import { singCSRFToken } from './services/TokenService';
import { ITitleEpisode } from './interfaces/Title';
import { updateSearch } from './controllers/root';
import { WebSocketListen } from './controllers/webSocket';
import { UpdatePopularTitles } from './controllers/title';
import { INotifyNewEpisode, NotifyService } from './services/NotifyService';
import { LoggerService } from './services/LoggerService';



chalk.level = 1;



export const Logger = new LoggerService();



if (prodMode && ip.address() !== config.vars.prodIP) {
  Logger.error(`[Startup]: Startup denied for ${ip.address()} (IP does not match default production IP)`);

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

const MONGO_URI = `mongodb://${prodMode ? `${config.service.DB!.PROD.USR}:${config.service.DB!.PROD.PWD}` : `${config.service.DB!.DEV.USR}:${config.service.DB!.DEV.PWD}`}@${config.db.HOST}:${config.db.PORT}/${prodMode ? config.service.DB!.PROD.DB_NAME : config.service.DB!.DEV.DB_NAME}` as const;

mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI, {
  retryWrites: true,
}).catch(e => {
  Logger.error('[Startup/MongoDB]: MongoDB connection errored', e);
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

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || req.ip || undefined;
  Logger.trace(`[Request/${IP}]: ${req.method} - ${req.url}`);

  next();
});

app.use('/dubber', router.DubberRouter);
app.use('/user', router.UserRouter);
app.use('/title', router.TitleRouter);

app.use('/', router.RootRouter);

if (devMode) {
  app.use('/dev', router.DevRouter);
}

wss.on('error', e => { Logger.error(`[Websocket]: Websocker server error`, e); });
wss.on('listening', () => {
  const mode = `${prodMode ? 'Production' : 'Development'}${testMode ? ' (Testing)' : ''}`;
  Logger.info(`[Startup]: Websocket server started in ${mode} mode at ws://${config.service.HOST}:${config.service.PORTS.WS}`);
});

/** Implementation of NotifyService */
export const Notify = new NotifyService();



(async function () {
  const mode = `${prodMode ? 'Production' : 'Development'}${testMode ? ' (Testing)' : ''}`;

  // Pre-init callback
  try {
    WebSocketListen();
  } catch (e) {
    Logger.error('[Startup/Pre-init Callback]: An error occured in one of pre-init handlers', e);
  }

  app.listen(config.service.PORTS.HTTP, config.service.HOST, () => {
    Logger.info(`[Startup]: HTTP server started in ${mode} mode at http://${config.service.HOST}:${config.service.PORTS.HTTP}`);
  });

  // Post-init callback
  try {
    await Promise.all([
      await updateSearch(),
      await UpdatePopularTitles(),
      await handler.removeUsersLinkTelegramToken(),
    ]);

    console.log(`
      ----------------------------
      ANIMEE-CORE STARTED UP
    
      Date: ${handler.getUTC().date} UTC0 ${handler.getUTC().time}
      Mode: ${mode}
      HTTP: ${config.service.HOST}:${config.service.PORTS.HTTP} ${devMode ? '(changed default, see config.ts)' : ''}
      WS: ${config.service.HOST}:${config.service.PORTS.WS}
      ----------------------------
    `);

    setInterval(async () => {
      Logger.info(`[Startup/Post-init Callback]: Cache updated`);

      // Update cache
      await Promise.all([
        await updateSearch(),
        await UpdatePopularTitles(),
        await handler.removeUsersLinkTelegramToken(),
      ]);
    }, 43200000); // 43200000 // 12h
  } catch (e) {
    Logger.error('[Startup/Post-init Callback]: An error occured in one of post-init handlers', e);
  }
})();



//! MUST BE BELOW ALL CODE
app.get('*', (req: express.Request, res: express.Response) => {
  const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || req.ip || undefined;

  Logger.suspicious(`[NotFound/${IP}]: Request ${req.url} rejected as 404`);
  return res.status(404).json({ message: 'Not Found' });
});