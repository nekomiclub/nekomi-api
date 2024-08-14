import { query, body, param } from 'express-validator';
import cors from 'cors';
import multer from 'multer';

import { AccessControl, CSRFCheck } from '../middlewares';
import { config } from '../config';



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

export const devGetAccessControl = [
  AccessControl(['dubber'])
];

export const devGetCSRFCheck = [
  CSRFCheck([config.vars.domain])
];


//* ------------------ USER MIDDLEWARES ------------------

export const userPatch = [
  CSRFCheck(['updater.animee.club', 'animee.club']),
  AccessControl(['basic']),
];

export const userSignin = [
  CSRFCheck(['animee.club']),
  body('session')
    .notEmpty().withMessage('Session can not be empty'),
];

export const userLogout = [
  CSRFCheck(['animee.club']),
];

//* ------------------ TITLE MIDDLEWARES ------------------

export const getTitlePopular = [
  CSRFCheck(['animee.club']),
];

export const postTitle = [
  CSRFCheck(['updater.animee.club', 'animee.club']),
  AccessControl(['titleAdd']),
];

export const patchTitleId = [
  CSRFCheck(['updater.animee.club', 'animee.club']),
  AccessControl(['basic']),
  upload.single('file'),
];

export const deleteTitleId = [
  CSRFCheck(['updater.animee.club', 'animee.club']),
  AccessControl(['titleDelete']),
];

//* ------------------ ROOT MIDDLEWARES ------------------

export const getSearch = [
  CSRFCheck(['updater.animee.club', 'animee.club']),
];