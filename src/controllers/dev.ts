import express from 'express';
import { catchError } from '../handlers/Errors';

/*
  ! THESE CONTROLLERS ARE USED ONLY FOR TESTING PURPOSES
  ! THEY WILL BE IGNORED IN PRODUCTION MODE
  ! DO NOT CHANGE THEM IF NOT NECESSARY
*/

export async function getAccessControl(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    console.log(req.animee);
    return res.status(200).json('ok');
  });
}

export async function getCSRFCheck(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    return res.status(200).json('ok');
  });
}