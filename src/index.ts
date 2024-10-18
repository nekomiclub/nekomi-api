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

import Router from './router';
import * as handler from './handlers/handlers';
import { updateSearch } from './controllers/root';
import { WebSocketOnlinePoll, WebsocketRouter } from './controllers/webSocket';
import { MiddlewareService } from './services/MiddlewareService';
import { Logger } from './services/LoggerService';
import { preserveIP } from './handlers/handler';
import { DubberService } from './Models/Dubber';
import TitleModel, { TitleService } from './Models/Title';
import Cache from './services/CacheService';



// Console color mode
chalk.level = 1;



// Prevent run production not on production IP
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
    'https://auth.animee.club',
    'https://api.animee.club',
    devMode ? 'http://192.168.0.106:3001' : '',
    devMode ? 'http://192.168.0.106:3000' : '',
  ],
  credentials: true,
};



app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors(CORSOpt));
app.options('*', cors(CORSOpt));

// Trace requests & set animee internal object
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
    await handler.removeUsersLinkTelegramToken(),
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
      ANIMEE-CORE STARTED UP
    
      Date: ${handler.getUTC().dateReversed} UTC-0 ${handler.getUTC().time}
      Mode: ${mode}
      HTTP: http://${preserveIP(config.service.HOST)}:${config.service.PORTS.HTTP} ${devMode ? '(port changed, see README.md)' : ''}
      WS: ${preserveIP(config.service.HOST)}:${config.service.PORTS.WS}
      ----------------------------
    `);

    const title = await TitleModel.find();
    const patcher = new TitleService({ title: title[0] });

    patcher.patchNames({ ukr: '  fsdh 12312      r782 fgsd     ' });

    // Cache updating
    setInterval(async () => {
      Logger.info(`[Startup/Post-init Callback]: Cache updated`);

      // Update cache
      await Promise.all([
        updateSearch(),
        handler.removeUsersLinkTelegramToken(),
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