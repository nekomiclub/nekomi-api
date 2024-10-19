import { query, body, param } from 'express-validator';
import cors from 'cors';
import multer from 'multer';

import { AccessControl, CSRFCheck } from '../middlewares';
import { config, CONSTS } from '../config';



/** CORS that pass any request but without cookies */
export const publicCORS = cors({
  origin: '*',
  credentials: false
});

/** Proxy file uploading */
const upload = multer();




//* ------------------ USER MIDDLEWARES ------------------

export const userPatch = [
  CSRFCheck([CONSTS.Domains.animee]),
  AccessControl(['basic']),
  body('method')
    .notEmpty().withMessage('Patch method must be provided')
];

export const userLinkTelegram = [
  CSRFCheck([CONSTS.Domains.animee_bot]),
  body(['animeeID', 'telegramID'])
    .notEmpty().withMessage('AnimeeID and TelegramID must be provided')
];

export const userLinkTelegramToken = [
  CSRFCheck([CONSTS.Domains.animee]),
  AccessControl(['basic'])
];

export const userLinkTelegramTokenVerify = [
  CSRFCheck([CONSTS.Domains.animee_bot]),
  body('token')
    .notEmpty().withMessage('Token can not be empty')
];

export const userSignin = [
  CSRFCheck([CONSTS.Domains.animee]),
  body('session')
    .notEmpty().withMessage('Session can not be empty'),
];

export const userLogout = [
  CSRFCheck([CONSTS.Domains.animee]),
];

export const userValidate = [
  CSRFCheck([CONSTS.Domains.animee]),
];

//* ------------------ TITLE MIDDLEWARES ------------------

export const getHomeWrapped = [
  CSRFCheck([CONSTS.Domains.animee]),
];

export const postTitle = [
  CSRFCheck([CONSTS.Domains.animee]),
  AccessControl(['titleAdd']),
];

export const patchTitleId = [
  CSRFCheck([CONSTS.Domains.animee]),
  AccessControl(['basic']),
  upload.single('file'),
];

export const deleteTitleId = [
  CSRFCheck([CONSTS.Domains.animee]),
  AccessControl(['titleDelete']),
];

//* ------------------ ROOT MIDDLEWARES ------------------

export const getSearch = [
  CSRFCheck([CONSTS.Domains.animee]),
];