import DubberService from '~/core/Services/DubberService';
import express from 'express';
import { HandleRequest } from '../Services/ErrorService';



export async function getAll(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const dubbers = await new DubberService().getAll();

    return res.status(200).json({ message: 'ok', dubbers });
  });
}