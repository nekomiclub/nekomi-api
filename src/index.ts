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

import { devMode, testMode, config, prodMode, CONSTS } from './config';

import Router from './router';
import { updateSearch } from './controllers/root';
import { WebSocketOnlinePoll, WebsocketRouter } from './controllers/webSocket';
import { MiddlewareService } from './services/MiddlewareService';
import { Logger } from './services/LoggerService';
import { getUTC, preserveIP } from './handlers/handler';
import { DubberService } from './Models/Dubber';
import TitleModel, { TitleService } from './Models/Title';
import Cache from './services/CacheService';
import { removeUsersLinkTelegramToken } from './handlers/handlers';
import { patchDubberModel, patchTitleModel, patchUserModel } from './handlers/modelPatchers';



// Console color mode
chalk.level = 1;



// Prevent run production not on production IP
if (prodMode && ip.address() !== config.vars.prodIP) {
  Logger.error(`[Startup]: Startup denied for ${ip.address()} (IP does not match default production IP)`);

  throw new Error(`
    ----------------------------
    NEKOMI-CORE STARTUP DENIED

    Current IP (${ip.address()}) has no permission to startup at production mode.
    ----------------------------
  `);
}



const hskey = prodMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/privkey.pem', 'utf8') : '';
const hscert = prodMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/cert.pem', 'utf8') : '';
const hschain = prodMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/fullchain.pem', 'utf8') : '';

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
    `https://${CONSTS.Domains.nekomi}`,
    `https://${CONSTS.Domains.nekomi_auth}`,
    `https://${CONSTS.Domains.nekomi_core}`,

    devMode ? 'http://192.168.0.106:3001' : '_null',
    devMode ? 'http://192.168.0.106:3000' : '_null',
  ].filter(el => el !== '_null'),
  credentials: true,
};



app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors(CORSOpt));
app.options('*', cors(CORSOpt));

// Trace requests & set nekomi internal object
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || req.ip || '';

  Logger.trace(`[Request/${IP}]: ${req.method} - ${req.url}`);
  req.animee = req.animee !== undefined ? req.animee : {};

  next();
});

// Routing
app.use('/dubber', Router.DubberRouter);
app.use('/user', Router.UserRouter);
app.use('/title', Router.TitleRouter);
app.use('/', Router.RootRouter);

wss.on('error', e => { Logger.error(`[Websocket]: Websocker server error`, e); });
wss.on('listening', () => {
  const mode = `${prodMode ? 'Production' : 'Development'}${testMode ? ' (Testing)' : ''}`;
  Logger.info(`[Startup]: Websocket server started in ${mode} mode at ws://${config.service.HOST}:${config.service.PORTS.WS}`);
});



(async function () {
  const mode = `${prodMode ? 'Production' : 'Development'}${testMode ? ' (Testing)' : ''}`;

  const REPETATIVE_HANDLERS = [
    await updateSearch(),
    await removeUsersLinkTelegramToken(),
  ] as const;

  app.listen(config.service.PORTS.HTTP, config.service.HOST, () => {
    Logger.info(`[Startup]: HTTP server started in ${mode} mode at http://${config.service.HOST}:${config.service.PORTS.HTTP}`);
  });

  wss.on('connection', WebsocketRouter);

  // Post-init callback
  try {
    await Promise.all(REPETATIVE_HANDLERS);

    console.log(`
      ----------------------------
      NEKOMI-CORE STARTED UP
    
      Date: ${getUTC().date} UTC-0 ${getUTC().time}
      Mode: ${mode}
      HTTP: http://${preserveIP(config.service.HOST)}:${config.service.PORTS.HTTP} ${devMode ? '(port changed, see README.md)' : ''}
      WS: ${preserveIP(config.service.HOST)}:${config.service.PORTS.WS}
      ----------------------------
    `);

    // Cache updating
    setInterval(async () => {
      Logger.info(`[Startup]: Cache updated`);

      // Update cache
      await Promise.all([
        updateSearch(),
        removeUsersLinkTelegramToken(),
        Cache.updateHomeWrapped()
      ]);
    }, 43200000); // 43200000 // 12h

    // Poll site online
    setInterval(async () => {
      await WebSocketOnlinePoll();
    }, 600000); // 600000 // 10m
  } catch (e) {
    Logger.error('[Startup/Post-init Callback]: An error occured in one of post-init handlers', e);
  }
})();



// 404 catcher. Writes suspicious logs
app.all('*', (req: express.Request, res: express.Response) => {
  const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || req.ip || '';

  if (req.url !== '/') {
    Logger.suspicious(`[NotFound/${IP}]: Request ${req.url} rejected as 404`);
  }

  return res.status(404).json({ message: 'Not Found', msg: 'Not Found', code: 'ERR_NOT_FOUND', status: 404 });
});