import { query, body } from 'express-validator';

import { AccessControl } from '../middlewares';
import { config } from '../config';

//* Validation
export const postDubbersParse = [
  body('queries')
    .notEmpty().withMessage('IDs are required')
];



export const devGetAccessControll = [
  AccessControl(['dubber'])
];