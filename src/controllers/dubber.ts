import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, catchError } from '../handlers/Errors';
import fs from 'fs';
import * as dto from '../handlers/dtos';
import Dubbers from '../Models/Dubber';
import { devMode } from '../config';
import { IDubber } from '../interfaces/Dubber';

export async function getOne(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { query } = req.params;

    const dubber = await Dubbers.findOne({ $or: [{ id: query }, { code: query }] });

    if (!dubber) {
      throw new E404(`Dubber ${query} is not found`);
    }

    return res.status(200).json({ msg: 'ok', dubber: dto.dubber(dubber.toObject()) });
  });
}

export async function getAll(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const dubbers = (await Dubbers.find()).map(dubber => dto.dubber(dubber.toObject()));

    return res.status(200).json({ msg: 'ok', dubbers });
  });
}