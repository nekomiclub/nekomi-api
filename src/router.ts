import express from 'express';
import * as v1C from './controllers/v1/index';
import * as v1CTitle from './controllers/v1/title';
import * as v1CDubber from './controllers/v1/dubber';
import * as v1CUser from './controllers/v1/user';
import * as v1CWS from './controllers/v1/ws';
import * as v1CProxy from './controllers/v1/proxy';

import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import { ensureAccess } from './middlewares';
import { body, cookie, param } from 'express-validator';
import { TAnimeGenres } from './core/interfaces';
import cors from 'cors';

export const ApiV1 = express.Router();
export const ProxyRouter = express.Router();

const titleValidation = [
  body([
    'names.eng',
    'names.ukr',
    'code',
    'poster',
    'background',
    'description',
    'estimatedEps',
    'year',
    'studios',
    'country',
  ]).notEmpty(),
  body('status').isIn(['announcement', 'ongoing', 'out', 'delayed']),
  body('genres').custom((input: TAnimeGenres[]) => {
    const genres: TAnimeGenres[] = [
      'chinese', '3D', 'shonen', 'shounenAi', 'seinen', 'shoujoAi', 'shoujo', 'comedy',
      'romance', 'school', 'martial arts', 'vampires', 'military', 'harem', 'demons',
      'detective', 'drama', 'games', 'historical', 'isekai', 'magic', 'mecha', 'music',
      'parody', 'sliceOfLife', 'adventure', 'psychological', 'samurai', 'supernatural',
      'sports', 'superpower', 'horror', 'sciFi', 'fantasy', 'action', 'ecchi', 'thriller',
      'erotica', 'gourmet'
    ];

    input.forEach(genre => {
      if (!genres.includes(genre)) {
        throw new Error(`Input includes wrong genre (${genre})`);
      }
    });

    return true;
  }),
  body('ageRate').isIn(['G', 'PG', 'PG-13', 'R-17', 'R+']),
  body('season').isIn(['summer', 'autumn', 'winter', 'spring']),
  body('type').isIn(['serial', 'ONA', 'OVA', 'film', 'special']),
  body([
    'rating',
    'started',
    'ended',
    'dubs',
    'epsMeta',
  ]).custom(input => {
    if (input === undefined) {
      throw new Error('Field must be notEmpty or null');
    }

    return true;
  })
];

//* - - - Title routes - - -
ApiV1.get(`/title/:query`, v1CTitle.getOne); // Test-covered
ApiV1.get(`/titles`, v1CTitle.getMany); // Test-covered
ApiV1.get(`/titles/search`, v1CTitle.search); // Test-covered
ApiV1.get(`/titles/total`, v1CTitle.total); // Test-covered

//! Private
ApiV1.patch(`/title`, ...[
  (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next),
  titleValidation,
], v1CTitle.update);

ApiV1.post(`/title`, ...[
  (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next),
  titleValidation,
], v1CTitle.create);

ApiV1.delete(`/title`, ...[
  (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next),
], v1CTitle.remove);



//* - - - Dubber routes - - -
ApiV1.get(`/dubber/:id`, v1CDubber.getOne); // Test-covered



//* - - - User routes - - -
ApiV1.get(`/user/:query`, v1CUser.get); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future; Test-covered

ApiV1.post(`/auth`, ...[
  body(['username', 'password']).notEmpty(),
], v1CUser.auth); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future

ApiV1.get(`/auth/refresh`, ...[
  cookie('refreshToken').notEmpty(),
], v1CUser.refresh); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future

ApiV1.get(`/auth/logout`, v1CUser.logout); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future

//! Private
ApiV1.post(`/user`, ...[
  body('username').isLength({ min: 3, max: 32 }).matches(/^[A-Za-z\s]+$/).withMessage('Name must be alphabetic.'),
  body('password').isLength({ min: 6, max: 32 }).withMessage('Password is too short/long. Min: 6, max: 32'),
], v1CUser.create); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future

ApiV1.delete(`/user`, ...[
  (req, res, next) => ensureAccess(['user'], req, res, next), body(['uid']).notEmpty(),
], v1CUser.remove); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future

ApiV1.patch(`/user`, ...[
  (req, res, next) => ensureAccess(['user', 'admin', 'root', 'moderator'], req, res, next),
  body('uid').notEmpty(),
], v1CUser.update); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future



//* - - - Proxy routes - - -
//! Testing proxy routes require available microservices. Tested for proxy routes will be written in future.

ProxyRouter.post('/postSnap', v1CProxy.createSnap); //* Require animee-uploads-bot microservice
ProxyRouter.post('/parseMetadata', v1CProxy.parseMetadata); //* Require animee-uploads-bot microservice

//* Media proxy
ProxyRouter.get(`/media/:id`, cors({ origin: '*', credentials: false }), v1CProxy.getMedia); //* Require animee-media microservice

ApiV1.post('/upload', ...[
  (req, res, next) => ensureAccess(['user'], req, res, next), multer().single('file')
], v1C.upload); //TODO Deprecated. Will be proxied in near future; Require animee-uploads microservice

ApiV1.put('/upload/:id', ...[
  (req, res, next) => ensureAccess(['user'], req, res, next), multer().single('file')
], v1C.updateUpload); //TODO Deprecated. Will be proxied in near future; Require animee-uploads microservice

ApiV1.delete('/upload/:id', ...[
  (req, res, next) => ensureAccess(['root', 'admin', 'dubber', 'editor'], req, res, next)
], v1C.deleteUpload); //TODO Deprecated. Will be proxied in near future; Require animee-uploads microservice



//* - - - Service routes - - -
ApiV1.get(`/global_stats`, v1C.getGS); // TODO Deprecated. Will deleted in near future

ApiV1.get(`/uptime`, v1C.uptime);

ApiV1.post(`/token/verify`, ...[
  (req, res, next) => ensureAccess(['user'], req, res, next), body(['token', 'method']).notEmpty()
], v1C.tokenVerify); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future

ApiV1.post(`/token/decode`, ...[
  (req, res, next) => ensureAccess(['user'], req, res, next), body(['token']).notEmpty()
], v1C.tokenDecode); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near future

ApiV1.post('/titleUpdate', v1C.titleUpdate);

ApiV1.post('/stat/record', ...[
  (req, res, next) => ensureAccess(['user', 'root'], req, res, next),
  body(['title', 'selectedDub', 'watchtime']).notEmpty()
], v1C.saveStatRecord); // TODO Deprecated. Will be refactored in near future



//* - - - ALLIASES - - -
ApiV1.get(`/media/:id`, cors({ origin: '*', credentials: false }), v1CProxy.getMedia); //! DEPRECATED. ALLIAS FOR /proxy/media/:id;