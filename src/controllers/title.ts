import express from 'express';
import axios, { AxiosError } from 'axios';

import * as dto from '../handlers/dtos';

import { E404, catchError } from '../handlers/v1/Errors';
import Title from '../Models/Title';



export async function getTitleQuery(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const { query } = req.params as { query: string };

    const title = await Title.findOne({ $or: [{ id: query }, { code: query }] });

    if (!title) {
      throw new E404(`Title (${query}) is not found`);
    }

    return res.status(200).json({ msg: 'ok', title: dto.title(title.toObject()) });
  });
}



export async function getTotal(req: express.Request, res: express.Response) {
  const routeCode = `${req.method} ${req.baseUrl}`;

  await catchError(req, res, routeCode, async () => {
    const titles = await Title.find();

    return res.status(200).json({ msg: 'ok', total: titles.length, renewed: titles.map(el => el.country !== 'null').length });
  });
}