import * as dto from '../handlers/dtos';
import Dubber from '../Models/Dubber';
import express from 'express';
import { E404, HandleRequest } from '../services/ErrorService';

export async function getOne(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const { query } = req.params;

    const dubber = await Dubber.findOne({ $or: [{ id: query }, { code: query }] });

    if (!dubber) {
      throw new E404(`Dubber ${query} is not found`);
    }

    return res.status(200).json({ msg: 'ok', dubber: dto.dubber(dubber.toObject()) });
  });
}

export async function getAll(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const dubbers = (await Dubber.find()).map(dubber => dto.dubber(dubber.toObject()));

    return res.status(200).json({ msg: 'ok', dubbers });
  });
}