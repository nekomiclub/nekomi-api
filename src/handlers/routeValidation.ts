import { query, body, param } from 'express-validator';
import cors from 'cors';
import multer from 'multer';

import { FkUsapiAuthRefresh, FkAuthorityVerify } from '../middlewares';
import { config } from '../config';



/** CORS that pass any request but without cookies */
export const publicCORS = cors({
  origin: '*',
  credentials: false
});

/** Proxy file uploading */
const upload = multer();




//* ------------------ USER MIDDLEWARES ------------------

export const userPatch = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
  FkUsapiAuthRefresh(['basic']),
  upload.single('file'),
  body('method')
    .notEmpty().withMessage('Patch method must be provided')
];

export const userLinkTelegram = [
  FkAuthorityVerify([config.DOMAIN.nekomi_bot]),
  body(['animeeID', 'telegramID'])
    .notEmpty().withMessage('AnimeeID and TelegramID must be provided')
];

export const userLinkTelegramToken = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
  FkUsapiAuthRefresh(['basic'])
];

export const userLinkTelegramTokenVerify = [
  FkAuthorityVerify([config.DOMAIN.nekomi_bot]),
  body('token')
    .notEmpty().withMessage('Token can not be empty')
];

export const userSignin = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
  body('session')
    .notEmpty().withMessage('Session can not be empty'),
];

export const userLogout = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
];

export const userValidate = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
];

//* ------------------ TITLE MIDDLEWARES ------------------

export const getHomeWrapped = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
];

export const postTitle = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
  FkUsapiAuthRefresh(['titleAdd']),
];

export const patchTitleId = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
  FkUsapiAuthRefresh(['basic']),
  upload.single('file'),
];

export const deleteTitleId = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
  FkUsapiAuthRefresh(['titleDelete']),
];

//* ------------------ ROOT MIDDLEWARES ------------------

export const getSearch = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
];

export const postUpload = [
  FkAuthorityVerify([config.DOMAIN.nekomi]),
  FkUsapiAuthRefresh(['root']),
  upload.single('file'),
  body('type')
    .notEmpty().withMessage('Type must be provided')
];