import cors from 'cors';
import multer from 'multer';
import { body } from 'express-validator';

import { CheckAccess, CheckCSRF } from '../middlewares';
import { config } from '../config';



/** CORS that pass any request but without cookies */
export const publicCORS = cors({
  origin: '*',
  credentials: false
});

/** Proxy file uploading */
const upload = multer();



//* ------------------ DUBBER MIDDLEWARES ------------------
export const dubberInviteSend = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['root']),
  body('user_id')
    .notEmpty().withMessage('User id must be provided'),
  body('dubber_id')
    .notEmpty().withMessage('Dubber id must be provided')
];

export const dubberSettingsMemberExclude = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['root']),
  body('user_id')
    .notEmpty().withMessage('User id must be provided'),
  body('dubber_id')
    .notEmpty().withMessage('Dubber id must be provided')
];

export const dubberInviteAcceptDecline = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  body('dubber_id')
    .notEmpty().withMessage('Dubber id must be provided')
];

export const dubberInviteVerify = [
  CheckAccess(['basic']),
];

export const dubberSettingsMemberEdit = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['root']),
  body('user_id')
    .notEmpty().withMessage('User id must be provided'),
  body('dubber_id')
    .notEmpty().withMessage('Dubber id must be provided')
];

//* ------------------ USER MIDDLEWARES ------------------

export const userPatch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  upload.single('file'),
  body('method')
    .notEmpty().withMessage('Patch method must be provided')
];

export const userLinkTelegram = [
  CheckCSRF([config.DOMAIN.nekomi_bot]),
  body(['animeeID', 'telegramID'])
    .notEmpty().withMessage('AnimeeID and TelegramID must be provided')
];

export const userLinkTelegramToken = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic'])
];

export const userLinkTelegramTokenVerify = [
  CheckCSRF([config.DOMAIN.nekomi_bot]),
  body('token')
    .notEmpty().withMessage('Token can not be empty')
];

export const userSignin = [
  CheckCSRF([config.DOMAIN.nekomi]),
  body('session')
    .notEmpty().withMessage('Session can not be empty'),
];

export const userLogout = [
  CheckCSRF([config.DOMAIN.nekomi]),
];

export const userValidate = [
  CheckCSRF([config.DOMAIN.nekomi]),
];

export const userPostTogether = [
  body('titleId')
    .notEmpty().withMessage('Title id can not be empty'),
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
];

//* ------------------ TITLE MIDDLEWARES ------------------

export const getHomeWrapped = [
  CheckCSRF([config.DOMAIN.nekomi]),
];

export const postTitle = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleAdd']),
];

export const patchTitleId = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  upload.single('file'),
];

export const deleteTitleId = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleDelete']),
];

//* ------------------ ROOT MIDDLEWARES ------------------

export const getSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
];

export const postUpload = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['admin']),
  upload.single('file'),
  body('type')
    .notEmpty().withMessage('Type must be provided')
];

export const deleteUpload = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['admin']),
];