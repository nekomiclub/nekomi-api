import { query, body, param } from 'express-validator';
import cors from 'cors';
import multer from 'multer';

import { FkUsapiAuthRefresh, FkAuthorityVerify } from '../middlewares';
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
  FkAuthorityVerify([CONSTS.Domains.animee]),
  FkUsapiAuthRefresh(['basic']),
  upload.single('file'),
  body('method')
    .notEmpty().withMessage('Patch method must be provided')
];

export const userLinkTelegram = [
  FkAuthorityVerify([CONSTS.Domains.animee_bot]),
  body(['animeeID', 'telegramID'])
    .notEmpty().withMessage('AnimeeID and TelegramID must be provided')
];

export const userLinkTelegramToken = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
  FkUsapiAuthRefresh(['basic'])
];

export const userLinkTelegramTokenVerify = [
  FkAuthorityVerify([CONSTS.Domains.animee_bot]),
  body('token')
    .notEmpty().withMessage('Token can not be empty')
];

export const userSignin = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
  body('session')
    .notEmpty().withMessage('Session can not be empty'),
];

export const userLogout = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
];

export const userValidate = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
];

//* ------------------ TITLE MIDDLEWARES ------------------

export const getHomeWrapped = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
];

export const postTitle = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
  FkUsapiAuthRefresh(['titleAdd']),
];

export const patchTitleId = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
  FkUsapiAuthRefresh(['basic']),
  upload.single('file'),
];

export const deleteTitleId = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
  FkUsapiAuthRefresh(['titleDelete']),
];

//* ------------------ ROOT MIDDLEWARES ------------------

export const getSearch = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
];

export const postUpload = [
  FkAuthorityVerify([CONSTS.Domains.animee]),
  FkUsapiAuthRefresh(['root']),
  upload.single('file'),
  body('type')
    .notEmpty().withMessage('Type must be provided')
];