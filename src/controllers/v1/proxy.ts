import express from 'express';
import { catchError } from '../../handlers/v1/handlers';
import axios from 'axios';
import { config } from '../../config';

export async function createSnap(req: express.Request, res: express.Response) {
  const routeCode = 'PROXY createSnap';

  await catchError(req, res, routeCode, async () => {
    await axios.post(`${config.microservices.postSnap}/postSnap`, req.body);
  });
}