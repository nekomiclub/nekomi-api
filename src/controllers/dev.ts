import express from 'express';
import { HandleRequest } from '../services/ErrorService';

/*
  ! THESE CONTROLLERS ARE USED ONLY FOR TESTING PURPOSES
  ! THEY WILL BE IGNORED IN PRODUCTION MODE
  ! DO NOT CHANGE THEM IF NOT NECESSARY
*/

/** @see /docs/routes/dev.md */
export async function getAccessControl(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    return res.status(200).json('ok');
  });
}

/** @see /docs/routes/dev.md */
export async function getCSRFCheck(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    return res.status(200).json('ok');
  });
}