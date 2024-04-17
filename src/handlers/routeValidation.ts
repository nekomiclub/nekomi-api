import { query, body } from 'express-validator';

import { AccessControl } from '../middlewares';
import { config } from '../config';

//* Validation
export const postDubbersParse = [
  body('queries')
    .notEmpty().withMessage('IDs are required')
];



export const getUserAuth = [
  body('session')
    .notEmpty().withMessage('Session can not be empty')
];

export const devGetAccessControll = [
  AccessControl(['dubber'])
];