import { query, body, param } from 'express-validator';

import { AccessControl } from '../middlewares';
import { config } from '../config';
import { patchUserMethods } from '../controllers/user';

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
  param('id')
    .notEmpty().withMessage('ID can not be empty')
];