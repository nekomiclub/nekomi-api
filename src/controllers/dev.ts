import express from 'express';
import { catchError } from '../handlers/v1/Errors';

export async function getAccessControl(req: express.Request, res: express.Response) {
  const route = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, route, async () => {
    return res.status(200).json('ok');
  });
}