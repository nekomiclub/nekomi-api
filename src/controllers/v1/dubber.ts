import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog } from '../../handlers/v1/Errors';
import fs from 'fs';
import { ITitle } from '../../core/interfaces';
import * as dto from '../../handlers/v1/dtos';
import Dubbers from '../../Models/Dubber';
import { devMode } from '../../config';

export async function getOne(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;

    const dubber = await Dubbers.findOne({ id });

    if (!dubber) {
      throw new E400('Dubber with provided id is not found');
    }

    return res.status(200).json(dto.dubber(dubber));
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(e);
      return res.status(e.code).json(e);
    } else {
      if (devMode) console.error(e);
      return res.status(500).json(e);
    }
  }
}