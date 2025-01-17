import Dubber from '../Models/Dubber';
import express from 'express';
import { HandleRequest } from '../services/ErrorService';
import { MongoDocumentDTO } from '~/core/services/DTO';



export async function getAll(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const dubbers = await Dubber.find();

    return res.status(200).json({ message: 'ok', dubbers: dubbers.map(dubber => new MongoDocumentDTO().dubber({ document: dubber })) });
  });
}