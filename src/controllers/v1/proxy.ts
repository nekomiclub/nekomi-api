import express from 'express';
import { catchError } from '../../handlers/v1/Errors';
import axios from 'axios';
import { config } from '../../config';

export async function createSnap(req: express.Request, res: express.Response) {
  const routeCode = 'PROXY createSnap';

  await catchError(req, res, routeCode, async () => {
    await axios.post(`${config.microservices.uploadsBotURL}/postSnap`, req.body);
  });
}

export async function parseMetadata(req: express.Request, res: express.Response) {
  const routeCode = 'PROXY parseMetadata';

  await catchError(req, res, routeCode, async () => {
    const response = await axios.post(`${config.microservices.uploadsBotURL}/parseMetadata`, req.body);
    return res.status(200).json(response.data);
  });
}