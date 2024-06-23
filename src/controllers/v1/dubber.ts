import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, catchError } from '../../handlers/Errors';
import fs from 'fs';
import * as dto from '../../handlers/dtos';
import Dubbers from '../../Models/Dubber';
import { devMode } from '../../config';
import { IDubber } from '../../interfaces/Dubber';

export async function getOne(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { query } = req.params;

    const dubber = await Dubbers.findOne({ $or: [{ id: query }, { code: query }] });

    if (!dubber) {
      throw new E404(`Dubber ${query} is not found`);
    }

    return res.status(200).json(dto.dubber(dubber.toObject()));
  });
}

export async function parse(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { queries } = req.body as { queries: string[] };
    let results: IDubber[] = [];

    for (const i in queries) {
      const query = queries[i];
      const res = await Dubbers.findOne({ $or: [{ id: query }, { name: query }, { code: query }] });

      try {
        results.push(dto.dubber(res!.toObject()));
      } catch (e) {
        null;
      }
    }

    return res.status(200).json({ results });
  });
}