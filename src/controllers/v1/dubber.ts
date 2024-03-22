import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, catchError } from '../../handlers/v1/Errors';
import fs from 'fs';
import { IDubber, ITitle } from '../../core/interfaces';
import * as dto from '../../handlers/v1/dtos';
import Dubbers from '../../Models/Dubber';
import { devMode } from '../../config';

export async function getOne(req: express.Request, res: express.Response) {
  const rouetCode = 'Dubber/Get';

  await catchError(req, res, rouetCode, async () => {
    const { query } = req.params;

    const dubber = await Dubbers.findOne({ $or: [{ id: query }, { code: query }] });

    if (!dubber) {
      throw new E404(`Dubber ${query} is not found`);
    }

    return res.status(200).json(dto.dubber(dubber));
  });
}

export async function parse(req: express.Request, res: express.Response) {
  const rouetCode = 'Dubber/Parse';

  await catchError(req, res, rouetCode, async () => {
    const { queries } = req.body as { queries: string[] };
    let results: IDubber[] = [];

    for (const i in queries) {
      const query = queries[i];

      try {
        results.push(dto.dubber(await Dubbers.findOne({ $or: [{ id: query }, { name: query }, { code: query }] })));
      } catch (e) {
        null;
      }
    }


    return res.status(200).json({ results });
  });
}