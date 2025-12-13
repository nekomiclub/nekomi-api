import DatabaseService from './services/DatabaseService';
import GenericRouter from './api/http/GenericController/GenericRouter';
import Logger from './services/LoggerService';
import bodyParser from 'body-parser';
import conf, { TestMode } from './config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { traceRequest } from './services/HTTPService';



//* === Declare HTTP server
export const app = express();



async function runtime() {
  try {
    //* === Clear up console
    console.clear();
    Logger.debug(`------------------ DRY RUN ------------------`);



    //* === Establish database connection
    await DatabaseService.connect();



    //* === Use HTTP middlewares
    app.use(cookieParser());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(traceRequest());

    app.use(cors({
      origin: ['http://127.0.0.1:3001'],
      credentials: true,
    }));



    //* === HTTP Routing
    app.use('/', GenericRouter);



    //* === HTTP Server
    if (!TestMode) {
      await new Promise(res => {
        app.listen(conf.env.PORT, conf.env.HOST, () => {
          Logger.debug(`[System/Init]: HTTP server started in ${conf.startedMode} mode at http://${conf.env.HOST}:${conf.env.PORT}. [commit: ${conf.commit}]`);

          res(1);
        });
      });
    }

    if (!TestMode) {
      console.log(`
    ----------------------------
    NEKOMI-API STARTED UP
    
    Date: ${conf.startedAt} UTC
    Commit: ${conf.commit}
    Mode: ${conf.startedMode}
    HTTP: http://${conf.env.HOST}:${conf.env.PORT}
    ----------------------------\n\n`);
    }

    // await LoadCatalog();
  } catch (e) {
    Logger.error(`[System/Init]: Some error occured in runtime`, e);
  }
}

runtime();