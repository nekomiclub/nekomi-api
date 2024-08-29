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

/** Proxy file uploading */
const upload = multer();



//* ------------------ DEV MIDDLEWARES ------------------

export const devGetAccessControl = [
  AccessControl(['dubber'])
];

export const devGetCSRFCheck = [
  CSRFCheck([config.vars.domain])
];


//* ------------------ USER MIDDLEWARES ------------------

export const userPatch = [
  CSRFCheck(['animee.club']),
  AccessControl(['basic']),
];

export const userLinkTelegram = [
  CSRFCheck(['bot.animee.club']),
  body(['animeeID', 'telegramID'])
    .notEmpty().withMessage('AnimeeID and TelegramID must be provided')
];

export const userSignin = [
  CSRFCheck(['animee.club']),
  body('session')
    .notEmpty().withMessage('Session can not be empty'),
];

export const userLogout = [
  CSRFCheck(['animee.club']),
];

export const userValidate = [
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