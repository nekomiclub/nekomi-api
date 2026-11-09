import './services/openapi/setup.js';

import conf, { isProduction, isTest } from './conf.js';

import AnimeRouter from './api/http/AnimeController/_router.js';
import AuthRouter from './api/http/AuthController/_router.js';
import DatabaseService from './services/DatabaseService.js';
import GenericRouter from './api/http/GenericController/_router.js';
import Logger from './services/LoggerService.js';
import Runtime from './runtime.js';
import TeamRouter from './api/http/TeamController/_router.js';
import UserRouter from './api/http/UserController/_router.js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import env from '~/utils/env.js';
import express from 'express';
import swaggerRouter from './services/openapi/swagger.js';
import { handleNotFound, traceRequest } from './utils/http-utils.js';




//* === Declare HTTP server
export const app = express();

//* === Use HTTP middlewares
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(traceRequest());

app.use(cors({
  origin: isProduction ? [
    conf.variables.nekomi_nextjs_url
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

app.use(handleNotFound());



async function runtime() {
  try {
    //* === Clear up console
    if (!isTest) {
      console.clear();
      Logger.debug(`------------------ DRY RUN ------------------`);
    }



    //* === Establish database connection
    await DatabaseService.connect();



    if (!isTest) {
      //* === HTTP Server
      await new Promise(res => {
        app.listen(env('PORT'), env('HOST'), () => {
          Logger.debug(`[System/Init]: HTTP server started in ${conf.started_mode} mode at http://${env('HOST')}:${env('PORT')}`);

          res(1);
        });
      });

      console.log(`
      ----------------------------
      NEKOMI-API STARTED UP
      
      Date: ${conf.started_at}
      Mode: ${conf.started_mode}
      HTTP: http://${env('HOST')}:${env('PORT')}
      ----------------------------\n\n`);
    }



    if (!isTest) await Runtime();
  } catch (e) {
    Logger.error(`[System/Init]: Some error occured in runtime`, e);
  }
}

runtime();