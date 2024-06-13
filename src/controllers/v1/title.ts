import express from 'express';
import fs from 'fs';
import path from 'path';
import type { ValidationError } from 'express-validator';
import * as uuid from 'uuid';
import { validationResult } from 'express-validator';
import Fuse from 'fuse.js';

import { testMode, devMode } from '../../config';
import Title from '../../Models/Title';
import { ErrorConstructor, E400, E401, E403, E404, E500, catchError } from '../../handlers/Errors';
import { randomNumber } from '../../handlers/handlers';
import * as dto from '../../handlers/dtos';
import { ITitle } from '../../interfaces/Title';

let fuse: Fuse<ITitle>;

async function updateFuse() {
  const titles = (await Title.find()).map(el => dto.title(el.toObject()));
  fuse = new Fuse(titles, {
    keys: ['names.eng', 'names.ukr', 'names.alt']
  });
}

updateFuse();


interface ISearch extends ITitle {
  query: string,
  page: number,
  limit: number,
}

export async function search(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    // @ts-ignore
    const { query, ...props } = req.query as ISearch;
    // @ts-ignore
    let { page, limit } = req.query as ISearch;

    page = page || 0;
    limit = limit || 30;

    if (!fuse) {
      throw new E500('Search is not ready now. Try again in few minutes');
    }

    if (query) {
      return res.status(200).json({ results: fuse.search(query, { limit: 30 }).map(el => el.item) });
    }

    let searchArray: any[] = [];
    for (const key in props) {
      const prop = props[key];

      if (!isNaN(+prop)) {
        searchArray.push({ [key]: +prop });
      } else {
        searchArray.push({ [key]: prop });
      }
    }

    let titles: ITitle[] = [];

    if (Object.keys(props).length) {
      const titlesRaw = await Title.find({ $and: searchArray });
      titlesRaw.forEach(title => {
        titles.push(dto.title(title.toObject()));
      });
    } else {
      const titlesRaw = await Title.find();
      titlesRaw.forEach(title => {
        titles.push(dto.title(title.toObject()));
      });
    }

    const results = titles.slice((+page === 0) ? 0 : ((+page + 1) * +limit) - (+limit - 1), (+page === 0) ? +limit : (+page + 1) * +limit);

    return res.status(200).json({ results });
  });
}

export async function getMany(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    let { limit, page } = req.query as { limit: number | undefined, page: number | undefined };

    let titles = await Title.find();
    let results: any[] = [];

    // Assign default values or make turn to number
    if (!limit || +limit <= 0 || +limit > 30) { limit = 30; } else {
      if (isNaN(+limit)) throw new E400('Limit can not be NaN');
      limit = +limit;
    }
    if (!page || page == 0) { page = 1; } else {
      if (isNaN(+page)) throw new E400('Page can not be NaN');
      page = +page;
    }

    results = titles.slice(page === 1 ? 0 : page === 2 ? limit + 1 : ((page - 1) * limit) + 1, page === 1 ? limit : (limit * page) + 1);

    return res.status(200).json({ results, total: titles.length });
  });
}