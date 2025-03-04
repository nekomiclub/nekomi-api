import DubberService from '~/core/services/DubberService';
import express from 'express';
import { HandleRequest } from '~/services/ErrorService';



export async function getAll(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const dubbers = await new DubberService().getAll();

    return res.status(200).json({ message: 'ok', dubbers });
  });
}