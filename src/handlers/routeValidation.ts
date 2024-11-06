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
  FkAuthorityVerify([config.DOMAINS.nekomi]),
  FkUsapiAuthRefresh(['basic']),
  upload.single('file'),
  body('method')
    .notEmpty().withMessage('Patch method must be provided')
];

export const userLinkTelegram = [
  FkAuthorityVerify([config.DOMAINS.nekomi_bot]),
  body(['animeeID', 'telegramID'])
    .notEmpty().withMessage('AnimeeID and TelegramID must be provided')
];

export const userLinkTelegramToken = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
  FkUsapiAuthRefresh(['basic'])
];

export const userLinkTelegramTokenVerify = [
  FkAuthorityVerify([config.DOMAINS.nekomi_bot]),
  body('token')
    .notEmpty().withMessage('Token can not be empty')
];

export const userSignin = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
  body('session')
    .notEmpty().withMessage('Session can not be empty'),
];

export const userLogout = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
];

export const userValidate = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
];

//* ------------------ TITLE MIDDLEWARES ------------------

export const getHomeWrapped = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
];

export const postTitle = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
  FkUsapiAuthRefresh(['titleAdd']),
];

export const patchTitleId = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
  FkUsapiAuthRefresh(['basic']),
  upload.single('file'),
];

export const deleteTitleId = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
  FkUsapiAuthRefresh(['titleDelete']),
];

//* ------------------ ROOT MIDDLEWARES ------------------

export const getSearch = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
];

export const postUpload = [
  FkAuthorityVerify([config.DOMAINS.nekomi]),
  FkUsapiAuthRefresh(['root']),
  upload.single('file'),
  body('type')
    .notEmpty().withMessage('Type must be provided')
];