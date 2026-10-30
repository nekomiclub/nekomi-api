import './services/openapi/setup';

import conf, { ProductionMode, TestMode } from './conf';

import AnimeRouter from './api/http/AnimeController/_router';
import AuthRouter from './api/http/AuthController/_router';
import DatabaseService from './services/DatabaseService';
import GenericRouter from './api/http/GenericController/_router';
import Logger from './services/LoggerService';
import Runtime from './runtime';
import TeamRouter from './api/http/TeamController/_router';
import UserRouter from './api/http/UserController/_router';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import swaggerRouter from './services/openapi/swagger';
import { traceRequest } from './utils/http-utils';




//* === Declare HTTP server
export const app = express();

//* === Use HTTP middlewares
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(traceRequest());

app.use(cors({
  origin: ProductionMode ? [
    conf.URL.nekomiSite
  ] : [
    'http://127.0.0.1:3001',
  ],
  credentials: true,
}));



//* === HTTP Routing
app.use('/docs', swaggerRouter);

app.use('/anime', AnimeRouter);
app.use('/team', TeamRouter);
app.use('/user', UserRouter);
app.use('/auth', AuthRouter);
app.use('/', GenericRouter);



async function runtime() {
  try {
    //* === Clear up console
    if (!TestMode) {
      console.clear();
      Logger.debug(`------------------ DRY RUN ------------------`);
    }



    //* === Establish database connection
    await DatabaseService.connect();



    if (!TestMode) {
      //* === HTTP Server
      await new Promise(res => {
        app.listen(conf.env.PORT, conf.env.HOST, () => {
          Logger.debug(`[System/Init]: HTTP server started in ${conf.startedMode} mode at http://${conf.env.HOST}:${conf.env.PORT}`);

          res(1);
        });
      });

      console.log(`
      ----------------------------
      NEKOMI-API STARTED UP
      
      Date: ${conf.startedAt} UTC
      Mode: ${conf.startedMode}
      HTTP: http://${conf.env.HOST}:${conf.env.PORT}
      ----------------------------\n\n`);
    }



    if (!TestMode) await Runtime();
  } catch (e) {
    Logger.error(`[System/Init]: Some error occured in runtime`, e);
  }
}

runtime();