import { query, body } from 'express-validator';
import express from 'express';

import { AccessControl } from '../../middlewares';

//* Validation
export const postDubbersParse = [
  body('queries')
    .notEmpty().withMessage('IDs are required')
];



export const devGetAccessControll = [
  AccessControl(['dubber'])
];