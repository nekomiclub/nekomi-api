import express from 'express';
import * as v1C from './controllers/v1/index';
import * as v1CTitle from './controllers/v1/title';
import * as v1CDubber from './controllers/v1/dubber';
import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import Storage from './Models/Storage';
import { privateRoute, uploadValidity } from './middlewares';
import { uploadStorage } from './services/v1/storage';
import { body } from 'express-validator';

export const ApiV1 = express.Router();
const upload = multer({ storage: uploadStorage });

ApiV1.get(`/title/:id`, v1CTitle.getOne);
ApiV1.get(`/titles`, v1CTitle.getMany);
ApiV1.get(`/dubber/:id`, v1CDubber.getOne);

ApiV1.get(`/global_stats`, v1C.getGS);
ApiV1.get(`/uptime`, v1C.uptime);
ApiV1.get(`/media/:id`, v1C.media);

// Private
ApiV1.post('/upload', privateRoute, upload.fields([{ name: 'file' }, { name: 'type' }]), uploadValidity, v1C.upload);

const titleValidation = [
  body([
    'names.eng',
    'names.ukr',
    'code',
    'posterURL',
    'backgroundURL',
    'description',
    'estimatedEps',
    'year',
    'studios',
    'country',
  ]).notEmpty(),
  body('status').isIn(['announcement', 'ongoing', 'out', 'delayed']),
  body('genres').custom((input: string[]) => {
    const genres = ['Shonen', 'Shoujo', 'Senen', 'Josei', 'Ecchi', 'Harem', 'Isekai', 'Mecha', 'Slice of Life', 'Kodomomuke', 'Iyashikei'];

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

ApiV1.patch(`/title`, titleValidation, v1CTitle.update);
ApiV1.post(`/title`, titleValidation, v1CTitle.create);
ApiV1.delete(`/title`, v1CTitle.remove);