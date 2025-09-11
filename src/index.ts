import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import AnimeRouter from './routes/AnimeRouter';
import DubberRouter from './routes/DubberRouter';
import GenericRouter from './routes/GenericRouter';
import Search from './services/SearchService';
import TokenService from './services/TokenService';
import UserRouter from './routes/UserRouter';
import { DevelopmentMode, ProductionMode, TestMode, config } from './config';
import { FullkekwUser_SessionTokenPayload } from './_core/interfaces/API/FullkekwUserAPI.intf';
import { Logger } from './services/LoggerService';
import { cronCurrentSeasonAnime } from './utils/fetch-seasonal';
import { getRequestIP } from './services/HTTPService';



//* Establish mongodb connection
mongoose.set('strictQuery', false);
mongoose.connect(config.mongodbUrl, {
  retryWrites: true,
}).catch(e => {
  Logger.fail('[System]: MongoDB connection failed', e);
});





//* Setup http middlewares
export const app = express();

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = [
      `https://${config.DOMAIN.nekomi}`,
      `https://${config.DOMAIN.nekomi_auth}`,
      `https://${config.DOMAIN.nekomi_api}`,

      !ProductionMode ? 'http://127.0.0.1:3001' : '_null',
      !ProductionMode ? 'http://127.0.0.1:3000' : '_null',
    ].filter(el => el !== '_null');

    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
}));

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));



//* Trace requests & set nekomi internal object
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const IP = getRequestIP(req.headers);
  const session = TokenService.decode<FullkekwUser_SessionTokenPayload>(req.cookies[config.vars.sessionCookie] ?? '');

  Logger.trace(`[Request/${IP}${session?.payload?.userId ? ` (${session.payload.userId})` : ''}]: ${req.method} - ${req.url}`);
  req.nekomi = req.nekomi !== undefined ? req.nekomi : {};

  return next();
});



//* Routing & handling
app.use('/dubber', DubberRouter);
app.use('/user', UserRouter);
app.use('/anime', AnimeRouter);
app.use('/', GenericRouter);



//* HTTP server
const UpdateHandlers = [
  Search.init(),
] as const;

(async function () {
  if (!TestMode) {
    app.listen(config.env.PORT, config.env.HOST, () => {
      Logger.info(`[System]: HTTP server started in ${config.startedMode} mode at http://${config.env.HOST}:${config.env.PORT}`);
    });
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



    // Callback body
    Promise.all(UpdateHandlers);

    if (!TestMode) {
      cronCurrentSeasonAnime();
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



// Rickroll
app.all(config.rickrollEndpoints, (req, res) => {
  const IP = getRequestIP(req.headers);

  Logger.info(`[Request/${IP}]: Request has been rickrolled`);

  return res.redirect(`https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley`);
});

// 404 catcher. Writes suspicious logs
app.all('*', (req, res) => {
  const IP = getRequestIP(req.headers);

  if (req.url !== '/') {
    Logger.suspicious(`[Request/${IP}]: ${req.method} - ${req.url} is not found`);
  }

  return res.status(404).json({ message: 'Not Found', code: 'ERR_NOT_FOUND', status: 404 });
});