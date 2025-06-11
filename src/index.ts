import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import AnimeRouter from './routes/AnimeRouter';
import DubberRouter from './routes/DubberRouter';
import GenericRouter from './routes/GenericRouter';
import Search from './services/SearchService';
import UserRouter from './routes/UserRouter';
import { ANIME_MODEL_UPDATE, USER_MODEL_UPDATE } from './utils/update-model';
import { DevelopmentMode, ProductionMode, TestMode, config } from './config';
import { Logger } from './services/LoggerService';
import { decodeToken } from './services/TokenService';
import { getRequestIP } from './services/HTTPService';
import { removeUsersLinkTelegramToken } from '~/utils/deprecated-utils';



//* Establish mongodb connection
mongoose.set('strictQuery', false);
mongoose.connect(config.mongodbUrl, {
  retryWrites: true,
}).catch(e => {
  Logger.fail('[System]: MongoDB connection failed', e);
});



const CORSOpt: CorsOptions = {
  origin: [
    `https://${config.DOMAIN.nekomi}`,
    `https://${config.DOMAIN.nekomiAuth}`,
    `https://${config.DOMAIN.nekomiApi}`,

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
app.use('/anime', AnimeRouter);
app.use('/', GenericRouter);



//* HTTP server
const UpdateHandlers = [
  removeUsersLinkTelegramToken(),
  Search.init(),
] as const;

(async function () {
  if (!TestMode) {
    app.listen(config.env.PORT, config.env.HOST, () => {
      Logger.info(`[System]: HTTP server started in ${config.startedMode} mode at http://${config.env.HOST}:${config.env.PORT}`);
    });
  }


  //! ONE-TIME HANDLER
  if (ProductionMode) {
    await ANIME_MODEL_UPDATE.run();
  }



  try {
    if (!TestMode) console.log(`
  ----------------------------
  NEKOMI-API STARTED UP

  Date: ${config.startedAt} UTC
  Commit: ${config.commit}
  Mode: ${config.startedMode}
  HTTP: http://${config.env.HOST}:${config.env.PORT} ${DevelopmentMode ? '(port changed, see README.md)' : ''}
  ----------------------------
    `);

    if (ProductionMode) {
      await USER_MODEL_UPDATE.run();
    }


    // Callback body
    Promise.all(UpdateHandlers);



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