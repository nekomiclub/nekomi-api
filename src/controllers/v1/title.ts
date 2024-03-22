import express from 'express';
import fs from 'fs';
import path from 'path';
import type { ValidationError } from 'express-validator';
import * as uuid from 'uuid';
import { validationResult } from 'express-validator';
import Fuse from 'fuse.js';

import { testMode, devMode } from '../../config';
import { ITitle } from '../../core/interfaces';
import Title from '../../Models/Title';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, E500, catchError } from '../../handlers/v1/Errors';
import { randomNumber } from '../../handlers/v1/handlers';
import * as dto from '../../handlers/v1/dtos';

let fuse: Fuse<ITitle>;

async function updateFuse() {
  const titles = (await Title.find()).map(el => dto.title(el));
  fuse = new Fuse(titles, {
    keys: ['names.eng', 'names.ukr', 'names.alt']
  });
}

updateFuse();


export async function getOne(req: express.Request, res: express.Response) {
  const routeCode = 'Title/Get';

  await catchError(req, res, routeCode, async () => {
    const { query } = req.params as { query: string };

    const db = await Title.findOne({ $or: [{ id: query }, { code: query }] });

    if (!db) {
      throw new E404(`Title ${query} is not found`);
    }

    let item: ITitle = dto.title(db);

    return res.status(200).json(item);
  });
}

interface ISearch extends ITitle {
  query: string,
  page: number,
  limit: number,
}

export async function search(req: express.Request, res: express.Response) {
  const routeCode = 'Title/Search';

  await catchError(req, res, routeCode, async () => {
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

    let titles = [];

    if (Object.keys(props).length) {
      titles = await Title.find({ $and: searchArray });
    } else {
      titles = await Title.find();
    }

    const results = titles.map(el => dto.title(el)).slice((+page === 0) ? 0 : ((+page + 1) * +limit) - (+limit - 1), (+page === 0) ? +limit : (+page + 1) * +limit);

    return res.status(200).json({ results });
  });
}

export async function getMany(req: express.Request, res: express.Response) {
  const routeCode = 'Titles/Get';

  await catchError(req, res, routeCode, async () => {
    let { limit, page } = req.query as { limit: number | undefined, page: number | undefined };

    let titles = await Title.find();
    let results: ITitle[] = [];

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

// 

export async function update(req: express.Request, res: express.Response) {
  const routeCode = 'Title/Update';

  await catchError(req, res, routeCode, async () => {
    const title = req.body as ITitle;

    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw validation.array();
    }

    const db = await Title.findOne({ id: title.id });

    if (!db) {
      throw new E404('Title with provided id is not found');
    }

    for (const key in title) {
      db[key] = title[key];
    }

    updateFuse();
    await db.save();

    return res.status(200).json(title);
  });
}

export async function create(req: express.Request, res: express.Response) {
  const routeCode = 'Title/Create';

  await catchError(req, res, routeCode, async () => {
    const titleRaw = req.body as ITitle;

    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw validation.array();
    }

    const id = `${testMode ? `testid-${uuid.v4()}` : uuid.v4()}`;

    const title: ITitle = {
      ...titleRaw,
      id
    };

    const dbItem = new Title(title);
    await dbItem.save();

    return res.status(201).json({ id });
  });
}

export async function remove(req: express.Request, res: express.Response) {
  const routeCode = 'Title/Delete';

  await catchError(req, res, routeCode, async () => {
    const { id } = req.body;

    const db = await Title.findOne({ id });

    if (!db) {
      throw new E404('Title with provided id is not found');
    }

    await Title.deleteOne({ id });

    return res.status(200).json('ok');
  });
}

export async function total(req: express.Request, res: express.Response) {
  const routeCode = 'Title/Total';

  await catchError(req, res, routeCode, async () => {
    const total = await Title.find();
    const renewed = total.filter(el => el.country !== 'null').length;

    return res.status(200).json({ total: total.length, renewed });
  });
}