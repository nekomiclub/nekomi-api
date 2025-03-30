import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import fs from 'fs';
import https from 'https';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';

import AnimeRouter from './routes/AnimeRouter';
import DubberRouter from './routes/DubberRouter';
import GenericRouter from './routes/GenericRouter';
import Search from './services/SearchService';
import UserRouter from './routes/UserRouter';
import getRequestIP from './utils/get-request-ip';
import { ANIME_MODEL_UPDATE, USER_MODEL_UPDATE } from './utils/update-model';
import { DevelopmentMode, INTERNALS, ProductionMode, TestMode, config } from './config';
import { Logger } from './services/LoggerService';
import { WebsocketRouter } from './controllers/webSocket';
import { decodeToken } from './services/TokenService';
import { removeUsersLinkTelegramToken } from '~/utils/deprecated-utils';



//* Establish mongodb connection
mongoose.set('strictQuery', false);
mongoose.connect(config.mongodbUrl, {
  retryWrites: true,
}).catch(e => {
  Logger.fail('[System]: MongoDB connection failed', e);
});



//* Setup websocket server
const hskey = ProductionMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/privkey.pem', 'utf8') : '';
const hscert = ProductionMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/cert.pem', 'utf8') : '';
const hschain = ProductionMode ? fs.readFileSync('/etc/letsencrypt/live/nekomi.club/fullchain.pem', 'utf8') : '';

// TODO: Prevent listen in test mode. Remove SSL cert
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

    !ProductionMode ? 'http://127.0.0.1:3001' : '_null',
    !ProductionMode ? 'http://127.0.0.1:3000' : '_null',
  ].filter(el => el !== '_null'),
  credentials: true,
};



//* Setup http middlewares
export const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors(CORSOpt));
app.options('*', cors(CORSOpt));



//* Trace requests & set nekomi internal object
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const IP = getRequestIP(req.headers);
  const session = decodeToken(req.cookies[config.vars.sessionCookie] ?? '');

  Logger.trace(`[Request/${IP}${session?.payload?.userId ? ` (${session.payload.userId})` : ''}]: ${req.method} - ${req.url}`);
  req.nekomi = req.nekomi !== undefined ? req.nekomi : {};

  next();
});



//* Routing & handling
app.use('/dubber', DubberRouter);
app.use('/user', UserRouter);
app.use(['/title', '/anime'], AnimeRouter);
app.use('/', GenericRouter);

wss.on('error', e => { Logger.error(`[System]: Websocket error occured`, e); });
wss.on('listening', () => {
  Logger.info(`[System]: Websocket server started in ${config.startedMode} mode at ws://${INTERNALS.ws_server.host}:${INTERNALS.ws_server.port}`);
});



//* HTTP server
const UpdateHandlers = [
  removeUsersLinkTelegramToken(),
  Search.init(),
] as const;

(async function () {
  wss.on('connection', WebsocketRouter);

  if (!TestMode) {
    app.listen(INTERNALS.http_server.port, INTERNALS.http_server.host, () => {
      Logger.info(`[System]: HTTP server started in ${config.startedMode} mode at http://${INTERNALS.http_server.host}:${INTERNALS.http_server.port}`);
    });
  }



  try {
    if (!TestMode) console.log(`
  ----------------------------
  NEKOMI-API STARTED UP

  Date: ${config.startedAt} UTC-0
  Commit: ${config.commit}
  Mode: ${config.startedMode}
  HTTP: http://${INTERNALS.http_server.host}:${INTERNALS.http_server.port} ${DevelopmentMode ? '(port changed, see README.md)' : ''}
  WS: ${INTERNALS.ws_server.host}:${INTERNALS.ws_server.port}
  ----------------------------
    `);


    // Callback body
    Promise.all(UpdateHandlers);

    // TODO: remove after use
    if (ProductionMode) {
      Promise.all([
        await ANIME_MODEL_UPDATE.run(),
        await USER_MODEL_UPDATE.run(),
      ]);
    }



    // Update cache
    setInterval(async () => {
      try {
        Logger.debug(`[System]: Updating cache...`);
        await Promise.all(UpdateHandlers);
        Logger.debug(`[System]: Cache updated`);
      } catch (e) {
        Logger.fail(`[System]: Cache does not updated due to unexpected error`, e);
      }
    }, 21600000); // 21600000 // 6h
  } catch (e) {
    Logger.error('[System]: An error occured in one of post-init handlers', e);
  }
})();

app.all(config.rickrollEndpoints, (req: express.Request, res: express.Response) => {
  const IP = getRequestIP(req.headers);

  Logger.info(`[Request/${IP}]: Request has been rickrolled`);

  return res.redirect(`https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley`);
});



//* 404 catcher. Writes suspicious logs
app.all('*', (req: express.Request, res: express.Response) => {
  const IP = getRequestIP(req.headers);

  if (req.url !== '/') {
    Logger.suspicious(`[Request/${IP}]: ${req.method} - ${req.url} is not found`);
  }

  return res.status(404).json({ message: 'Not Found', code: 'ERR_NOT_FOUND', status: 404 });
});