import { query, body, param } from 'express-validator';
import cors from 'cors';
import multer from 'multer';

import { AccessControl, CSRFCheck } from '../middlewares';
import { config } from '../config';
import { patchUserMethods } from '../controllers/user';



/** CORS that pass any request but without cookies */
export const publicCORS = cors({
  origin: '*',
  credentials: false
});

/** CORS that works with cookies and pass only specified origins */
export const privateCORS = cors({
  origin: [
    config.URL.client,
    config.URL.updater,
  ],
  credentials: true
});

/** Proxy file uploading */
const upload = multer();



//* Validation
export const postDubbersParse = [
  body('queries')
    .notEmpty().withMessage('IDs are required')
];


//* ------------------ DEV MIDDLEWARES ------------------

export const devGetAccessControll = [
  AccessControl(['dubber'])
];



//* ------------------ USER MIDDLEWARES ------------------

export const getUserAuth = [
  body('session')
    .notEmpty().withMessage('Session can not be empty')
];

export const userPatch = [
  privateCORS,
  AccessControl(['basic']),
  body('method')
    .notEmpty().withMessage('Method can not be empty')
    .isIn(patchUserMethods).withMessage('Method invalid'),
  CSRFCheck(['updater.animee.club', 'animee.club']),
];

export const userSignin = [
  ...getUserAuth,
  privateCORS,
  // CSRFCheck(['updater.animee.club', 'animee.club']),
];

//* ------------------ TITLE MIDDLEWARES ------------------

export const postTitle = [
  privateCORS,
  AccessControl(['titleAdd']),
  CSRFCheck(['updater.animee.club', 'animee.club']),
];

export const patchTitleId = [
  privateCORS,
  AccessControl(['basic']),
  param('id')
    .notEmpty().withMessage('ID can not be empty'),
  CSRFCheck(['updater.animee.club', 'animee.club']),
  upload.single('file'),
];

export const deleteTitleId = [
  privateCORS,
  AccessControl(['titleDelete']),
  param('id')
    .notEmpty().withMessage('ID can not be empty'),
  CSRFCheck(['updater.animee.club', 'animee.club']),
];