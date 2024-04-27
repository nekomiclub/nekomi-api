import express from 'express';
import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import { body, cookie, param, query } from 'express-validator';
import cors from 'cors';
import ip from 'ip';

import * as RouteValidation from './handlers/routeValidation';
import * as v1C from './controllers/v1/index';
import * as v1CTitle from './controllers/v1/title';
import * as v1CDubber from './controllers/v1/dubber';
import * as v1CWS from './controllers/v1/ws';
import * as v1CProxy from './controllers/v1/proxy';

import { TAnimeGenre } from './interfaces/Title';
import { ensureAccess } from './middlewares';



/** @deprecated use specified routers */
export const ApiV1 = express.Router();
export const ProxyRouter = express.Router();

export const UserRouter = express.Router();
export const TitleRouter = express.Router();

export const DevRouter = express.Router();

/** CORS that pass any request but without cookies */
const publicCORS = cors({
  origin: '*',
  credentials: false
});

/** CORS that works with cookies and pass only specified origins */
const privateCORS = cors({
  origin: [
    config.URL.client
  ],
  credentials: true
});



/** @deprecated */
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
    'country',
  ]).notEmpty(),
  body('status').isIn(['announcement', 'ongoing', 'out', 'delayed']),
  body('genres').custom((input: TAnimeGenre[]) => {
    const genres: TAnimeGenre[] = [
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



//* ------------------ DEV ROUTER ------------------
// Test-only routes
import * as DevController from './controllers/dev';

DevRouter.get('/AccessControll', RouteValidation.devGetAccessControll, DevController.getAccessControl);




//* ------------------ TITLE ROUTER ------------------
import * as TitleController from './controllers/title';

TitleRouter.get('/total', TitleController.getTotal);
TitleRouter.post('/', privateCORS, TitleController.postTitle);
TitleRouter.patch('/:id', privateCORS, RouteValidation.patchTitleId, TitleController.patchTitle);
TitleRouter.delete('/:id', privateCORS, TitleController.deleteTitle);



/** @deprecated */
ApiV1.get(`/titles`, privateCORS, v1CTitle.getMany);
/** @deprecated */
ApiV1.get(`/titles/search`, privateCORS, v1CTitle.search);



//! Must be below all endpoints
TitleRouter.get('/:query', privateCORS, TitleController.getTitleQuery);

//! Private
/** @deprecated All patch requests must be refactored in 1.1.0 */
ApiV1.patch(`/title`, ...[
  (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next),
  titleValidation,
], v1CTitle.update); //! MUST BE REFACTORED DUE DANGEROUS IMPACT

ApiV1.post(`/title`, ...[
  (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next),
  titleValidation,
], v1CTitle.create);

ApiV1.delete(`/title`, ...[
  (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next),
], v1CTitle.remove);



//* ------------------ DUBBER ROUTER ------------------
ApiV1.get(`/dubber/:query`, privateCORS, v1CDubber.getOne);
ApiV1.post(`/dubber/parse`, privateCORS, RouteValidation.postDubbersParse, v1CDubber.parse);



//* ------------------ USER ROUTER ------------------
import * as UserController from './controllers/user';
import { config } from './config';

UserRouter.get(`/logout`, privateCORS, UserController.getLogout);
UserRouter.get(`/:query`, privateCORS, UserController.getQuery);
UserRouter.post(`/signin`, privateCORS, RouteValidation.getUserAuth, UserController.postSignin);
UserRouter.patch(`/`, privateCORS, RouteValidation.userPatch, UserController.patchUser);



ApiV1.delete(`/user`, ...[
  (req, res, next) => ensureAccess(['user'], req, res, next), body(['uid']).notEmpty(),
], UserController.remove); // TODO Deprecated. Will be replaced with fullkekw-auth microservice in near futureST BE REFACTORED DUE DANGEROUS IMPACT



//* ------------------ PROXY ROUTER ------------------
//! Testing proxy routes require available microservices. Tested for proxy routes will be written in future.

ProxyRouter.post('/postSnap', v1CProxy.createSnap); //* Require animee-uploads-bot microservice
ProxyRouter.post('/parseMetadata', v1CProxy.parseMetadata); //* Require animee-uploads-bot microservice

//* Media proxy
ProxyRouter.get(`/media/:id`, publicCORS, v1CProxy.getMedia); //! DEPRECATED. Use media.animee.club/:id instead.

ApiV1.post('/upload', ...[
  (req, res, next) => ensureAccess(['user'], req, res, next), multer().single('file')
], v1C.upload); //TODO Deprecated. Will be proxied in near future; Require animee-uploads microservice

ApiV1.put('/upload/:id', ...[
  (req, res, next) => ensureAccess(['user'], req, res, next), multer().single('file')
], v1C.updateUpload); //TODO Deprecated. Will be proxied in near future; Require animee-uploads microservice

ApiV1.delete('/upload/:id', ...[
  (req, res, next) => ensureAccess(['root', 'admin', 'dubber', 'editor'], req, res, next)
], v1C.deleteUpload); //TODO Deprecated. Will be proxied in near future; Require animee-uploads microservice



//* ------------------ SERVICE ROUTER ------------------
ApiV1.get(`/uptime`, v1C.uptime);

ApiV1.post('/titleUpdate', v1C.titleUpdate);



//* ------------------ ALLIASES ------------------
ApiV1.get(`/media/:id`, publicCORS, v1CProxy.getMedia); //! DEPRECATED. ALLIAS FOR /proxy/media/:id;