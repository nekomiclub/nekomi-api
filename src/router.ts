import express from 'express';
import * as v1C from './controllers/v1/index';
import * as v1CTitle from './controllers/v1/title';
import * as v1CDubber from './controllers/v1/dubber';
import * as v1CUser from './controllers/v1/user';

import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import Storage from './Models/Storage';
import { uploadValidity, ensureAccess } from './middlewares';
import { uploadStorage } from './services/v1/storage';
import { body, cookie, param } from 'express-validator';
import { TAnimeGenres } from './core/interfaces';

export const ApiV1 = express.Router();
const upload = multer({ storage: uploadStorage });

// TODO (req, res, next) => ensureAccess(['ROLE'], req, res, next)

ApiV1.get(`/title/:id`, v1CTitle.getOne);
ApiV1.get(`/titles`, v1CTitle.getMany);
ApiV1.get(`/titles/search`, v1CTitle.search);
ApiV1.get(`/dubber/:id`, v1CDubber.getOne);

ApiV1.get(`/global_stats`, v1C.getGS);
ApiV1.get(`/uptime`, v1C.uptime);
ApiV1.get(`/media/:id`, v1C.media);

ApiV1.post(`/auth`, body(['username', 'password']).notEmpty(), v1CUser.auth);
ApiV1.get(`/refresh`, cookie('refreshToken').notEmpty(), v1CUser.refresh);

ApiV1.post(`/token/verify`, (req, res, next) => ensureAccess(['user'], req, res, next), body(['token', 'method']).notEmpty(), v1C.tokenVerify);
ApiV1.post(`/token/decode`, (req, res, next) => ensureAccess(['user'], req, res, next), body(['token']).notEmpty(), v1C.tokenDecode);

ApiV1.get(`/user/:uid`, param('uid').notEmpty(), v1CUser.get);
ApiV1.post(`/user`, body('username').isLength({ min: 3, max: 32 }).matches(/^[A-Za-z\s]+$/).withMessage('Name must be alphabetic.'), body('password').isLength({ min: 6, max: 32 }).withMessage('Password is too short/long. Min: 6, max: 32'), v1CUser.create);

ApiV1.delete(`/user`, (req, res, next) => ensureAccess(['user'], req, res, next), body(['uid']).notEmpty(), v1CUser.remove);

//! Private
ApiV1.post('/upload', (req, res, next) => ensureAccess(['user'], req, res, next), upload.fields([{ name: 'file' }, { name: 'type' }, { name: 'quality' }]), uploadValidity, v1C.upload); //! Half-private, user can upload only picture, root & editor can upload video.
ApiV1.delete('/upload', (req, res, next) => ensureAccess(['root', 'admin', 'dubber', 'editor', 'subber'], req, res, next), v1C.deleteUpload);

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
      'erotica'
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
  body('type').isIn(['serial', 'ONA', 'OVA', 'film']),
  body([
    'rating',
    'started',
    'ended',
    'dubs',
    'epsMeta',
    'linkedManga',
    'linkedTitlesIDs'
  ]).custom(input => {
    if (input === undefined) {
      throw new Error('Field must be notEmpty or null');
    }

    return true;
  })
];

ApiV1.patch(`/title`, (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next), titleValidation, v1CTitle.update);
ApiV1.post(`/title`, (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next), titleValidation, v1CTitle.create);
ApiV1.delete(`/title`, (req, res, next) => ensureAccess(['root', 'admin', 'editor'], req, res, next), v1CTitle.remove);

ApiV1.post('/titleUpdate', v1C.titleUpdate); // TODO Fix access issue

ApiV1.patch(`/user`, (req, res, next) => ensureAccess(['user', 'admin', 'root', 'moderator'], req, res, next), body('uid').notEmpty(), v1CUser.update);