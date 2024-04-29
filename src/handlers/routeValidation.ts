import { query, body, param } from 'express-validator';
import cors from 'cors';
import multer from 'multer';

import { AccessControl } from '../middlewares';
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
    config.URL.client
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
  AccessControl(['basic']),
  body('method')
    .notEmpty().withMessage('Method can not be empty')
    .isIn(patchUserMethods).withMessage('Method invalid')
];

//* ------------------ TITLE MIDDLEWARES ------------------

export const patchTitleId = [
  AccessControl(['basic']),
  privateCORS,
  param('id')
    .notEmpty().withMessage('ID can not be empty'),
  upload.single('file'),
];

export const deleteTitleId = [
  AccessControl(['titleDelete']),
  param('id')
    .notEmpty().withMessage('ID can not be empty')
];