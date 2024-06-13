import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import https from 'https';
import http from 'http';
import cors, { CorsOptions } from 'cors';
import fs from 'fs';
import path from 'path';
import ip from 'ip';

import { devMode, testMode, config, prodMode } from './config';

import * as router from './router';
import * as handler from './handlers/handlers';
import { E403 } from './handlers/Errors';
import Title from './Models/Title';
import { WebSocketServer } from 'ws';
import { listenWSS } from './controllers/v1/ws';
import { createUser } from './Models/User';
import { signToken } from './services/TokenService';



if (prodMode && ip.address() !== config.vars.prodIP) {
  throw new Error(`
    ----------------------------
    ANIMEE-API STARTUP DENIED

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
  console.error('------------- CRITICAL ERROR -------------\nMongo DB exception occured - ');
  console.error(e);
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

app.use('/user', router.UserRouter);
app.use('/title', router.TitleRouter);



if (prodMode) {
  app.enable('trust proxy');

  // HTTP > HTTPS redirect
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }

    next();
  });
}

if (devMode) {
  app.use('/dev', router.DevRouter);
}

wss.on('error', e => { throw e; });



const server = app.listen(config.service.PORTS.HTTP, config.service.HOST, () => {
  server.keepAliveTimeout = 10000;
  server.headersTimeout = 15000;

  console.log(`
    ----------------------------
    ANIMEE-API STARTED UP
  
    Date: ${handler.getUTC().date} UTC0 ${handler.getUTC().time}
    Mode: ${prodMode ? 'Production' : 'Development'} ${testMode ? '(Testing)' : ''}
    HTTP: ${config.service.HOST}:${config.service.PORTS.HTTP} ${devMode ? '(changed default, see config.ts)' : ''}
    HTTPS: ${prodMode ? 'NGINX serve' : 'Disabled in dev mode'}
    WS: ${config.service.HOST}:${config.service.PORTS.WS}
    ----------------------------
  `);

  listenWSS();

  //* Callbacks
  (async function () {
    try {

    } catch (e) {
      console.error(`An error occured in after startup callback`);
      console.error(e);
    }
  })();
});
