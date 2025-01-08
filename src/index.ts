import { DevelopmentMode, INTERNALS, ProductionMode, config } from './config';

import bodyParser from 'body-parser';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import fs from 'fs';
import https from 'https';
import ip from 'ip';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';

import Cache from './services/CacheService';
import Router from './router';
import { Logger } from './services/LoggerService';
import { WebSocketOnlinePoll, WebsocketRouter } from './controllers/webSocket';
import { decodeToken } from './services/TokenService';
import { removeUsersLinkTelegramToken } from './handlers/handlers';
import { updateSearch } from './controllers/root';



// Preflight
chalk.level = 1;



//* Prevent run production not on production machine
if (ProductionMode && ip.address() !== config.vars.prodIP) {
  Logger.error(`[Startup]: Startup denied for ${ip.address()} (IP does not match default production IP)`);

  throw new Error(`
    ----------------------------
    NEKOMI-CORE STARTUP DENIED

    Current IP (${ip.address()}) is not permitted to run production
    ----------------------------
  `);
}



//* Establish mongodb connection
mongoose.set('strictQuery', false);
mongoose.connect(config.mongodbUrl, {
  retryWrites: true,
}).catch(e => {
  Logger.fail('[Startup/MongoDB]: MongoDB connection errored', e);
});



//* Setup websocket server
const hskey = ProductionMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/privkey.pem', 'utf8') : '';
const hscert = ProductionMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/cert.pem', 'utf8') : '';
const hschain = ProductionMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/fullchain.pem', 'utf8') : '';

export const app = express();
export const wss = ProductionMode ? new WebSocketServer({
  server: https.createServer({
    key: hskey,
    cert: hscert,
    ca: [hschain],
  }).listen(INTERNALS.ws_server.port, INTERNALS.ws_server.host)
}) : new WebSocketServer({
  host: INTERNALS.ws_server.host,
  port: INTERNALS.ws_server.port,
});

const CORSOpt: CorsOptions = {
  origin: [
    `https://${config.DOMAIN.nekomi}`,
    `https://${config.DOMAIN.nekomi_auth}`,
    `https://${config.DOMAIN.nekomi_core}`,

    !ProductionMode ? 'http://192.168.0.106:3001' : '_null',
    !ProductionMode ? 'http://192.168.0.106:3000' : '_null',
  ].filter(el => el !== '_null'),
  credentials: true,
};



//* Setup http middlewares
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors(CORSOpt));
app.options('*', cors(CORSOpt));



//* Trace requests & set nekomi internal object
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || req.ip || '';
  const session = decodeToken(req.cookies[config.vars.sessionCookie] ?? '');

  Logger.trace(`[Request/${IP}${session?.payload?.userId ? ` (${session.payload.userId})` : ''}]: ${req.method} - ${req.url}`);
  req.nekomi = req.nekomi !== undefined ? req.nekomi : {};

  next();
});



//* Routing & handling
app.use('/dubber', Router.DubberRouter);
app.use('/user', Router.UserRouter);
app.use('/title', Router.TitleRouter);
app.use('/', Router.RootRouter);

wss.on('error', e => { Logger.error(`[Websocket]: Websocker server error`, e); });
wss.on('listening', () => {
  Logger.info(`[Startup]: Websocket server started in ${config.startedMode} mode at ws://${INTERNALS.ws_server.host}:${INTERNALS.ws_server.port}`);
});



//* HTTP server
(async function () {
  const REPETATIVE_HANDLERS = [
    await updateSearch(),
    await removeUsersLinkTelegramToken(),
  ] as const;

  wss.on('connection', WebsocketRouter);

  app.listen(INTERNALS.http_server.port, INTERNALS.http_server.host, async () => {
    Logger.info(`[Startup]: HTTP server started in ${config.startedMode} mode at http://${INTERNALS.http_server.host}:${INTERNALS.http_server.port}`);

    // Post-init callback
    try {
      await Promise.all(REPETATIVE_HANDLERS);

      console.log(`
  ----------------------------
  NEKOMI-CORE STARTED UP

  Date: ${config.startedAt} UTC-0
  Commit: ${config.commit}
  Mode: ${config.startedMode}
  HTTP: http://${INTERNALS.http_server.host}:${INTERNALS.http_server.port} ${DevelopmentMode ? '(port changed, see README.md)' : ''}
  WS: ${INTERNALS.ws_server.host}:${INTERNALS.ws_server.port}
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
  });

})();



//* 404 catcher. Writes suspicious logs
app.all('*', (req: express.Request, res: express.Response) => {
  const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || req.ip || '';

  if (req.url !== '/') {
    Logger.suspicious(`[NotFound/${IP}]: Request ${req.url} rejected as 404`);
  }

  return res.status(404).json({ message: 'Not Found', msg: 'Not Found', code: 'ERR_NOT_FOUND', status: 404 });
});