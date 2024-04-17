import express from 'express';
import { catchError } from '../handlers/v1/Errors';

/*
  ! THESE CONTROLLERS ARE USED ONLY FOR TESTING PURPOSES
  ! THEY WILL BE IGNORED IN PRODUCTION MODE
  ! DO NOT CHANGE THEM IF NOT NECESSARY
*/

export async function getAccessControl(req: express.Request, res: express.Response) {
  const route = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, route, async () => {
    return res.status(200).json('ok');
  });
}