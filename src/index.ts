import { INTERNALS, config, devMode, prodMode, testMode } from './config';

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
import { patchDubberModel, patchUserModel } from './handlers/modelPatchers';
import { removeUsersLinkTelegramToken } from './handlers/handlers';
import { updateSearch } from './controllers/root';



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

const MONGO_URI = `mongodb://${INTERNALS.database.creds!.usr}:${INTERNALS.database.creds!.pwd}@${INTERNALS.database.host}:${INTERNALS.database.port}/${INTERNALS.database.creds!.name}`;

mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI, {
  retryWrites: true,
}).catch(e => {
  Logger.fail('[Startup/MongoDB]: MongoDB connection errored', e);
});

export const app = express();
export const wss = devMode ? new WebSocketServer({
  host: INTERNALS.ws_server.host,
  port: INTERNALS.ws_server.port,
}) : new WebSocketServer({
  server: https.createServer({
    key: hskey,
    cert: hscert,
    ca: [hschain],
  }).listen(INTERNALS.ws_server.port, INTERNALS.ws_server.host)
});

const CORSOpt: CorsOptions = {
  origin: [
    `https://${config.DOMAIN.nekomi}`,
    `https://${config.DOMAIN.nekomi_auth}`,
    `https://${config.DOMAIN.nekomi_core}`,

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
  const session = decodeToken(req.cookies[config.vars.sessionCookie] ?? '');

  Logger.trace(`[Request/${IP}${session?.payload?.userId ? ` (${session.payload.userId})` : ''}]: ${req.method} - ${req.url}`);
  req.nekomi = req.nekomi !== undefined ? req.nekomi : {};

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
  Logger.info(`[Startup]: Websocket server started in ${mode} mode at ws://${INTERNALS.ws_server.host}:${INTERNALS.ws_server}`);
});



(async function () {
  const mode = `${prodMode ? 'Production' : 'Development'}${testMode ? ' (Testing)' : ''}`;

  const REPETATIVE_HANDLERS = [
    await updateSearch(),
    await removeUsersLinkTelegramToken(),
  ] as const;

  app.listen(INTERNALS.http_server.port, INTERNALS.http_server.host, () => {
    Logger.info(`[Startup]: HTTP server started in ${mode} mode at http://${INTERNALS.http_server.host}:${INTERNALS.http_server.port}`);
  });

  wss.on('connection', WebsocketRouter);

  // Post-init callback
  try {
    await Promise.all(REPETATIVE_HANDLERS);

    console.log(`
      ----------------------------
      NEKOMI-CORE STARTED UP
    
      Date: ${config.startedAt} UTC0
      Commit: ${config.commit}
      Mode: ${mode}
      HTTP: http://${INTERNALS.http_server.host}:${INTERNALS.http_server.port} ${devMode ? '(port changed, see README.md)' : ''}
      WS: ${INTERNALS.ws_server.host}:${INTERNALS.ws_server.port}
      ----------------------------
    `);

    if (prodMode) {
      await patchDubberModel();
      await patchUserModel();
    }

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