import express from 'express';
import fs from 'fs';
import type { ValidationError } from 'express-validator';
import * as uuid from 'uuid';
import { validationResult } from 'express-validator';
import Fuse from 'fuse.js';

import { testMode, devMode } from '../../config';
import { ITitle } from '../../core/interfaces';
import Storage from '../../Models/Storage';
import Title from '../../Models/Title';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, E500 } from '../../handlers/v1/Errors';
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
  try {
    const { query } = req.params as { query: string };

    const db = await Title.findOne({ $or: [{ id: query }, { code: query }] });

    if (!db) {
      throw new E400('Title with provided query not found');
    }

    let item: ITitle = dto.title(db);

    return res.status(200).json(item);
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

interface ISearch extends ITitle {
  query: string,
  page: number,
  limit: number,
}

export async function search(req: express.Request, res: express.Response) {
  try {
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

export async function getMany(req: express.Request, res: express.Response) {
  try {
    const { limit, page } = req.query;

    if (!limit || !page) {
      throw new E400('No limit or page provided');
    }

    if (+limit >= 30) {
      throw new E400('Limit can not be greater than 30');
    } else if (+limit < 0) {
      throw new E400('Limit can not be less than 0');
    }

    const titles = Array.from(await Title.find()).slice((+page === 0) ? 0 : ((+page + 1) * +limit) - (+limit - 1), (+page === 0) ? +limit : (+page + 1) * +limit);
    const sliced: ITitle[] = [];

    titles.forEach(title => {
      sliced.push(dto.title(title));
    });

    return res.status(200).json({ titles: sliced });
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

// 

export async function update(req: express.Request, res: express.Response) {
  try {
    const title = req.body as ITitle;

    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw validation.array();
    }

    const db = await Title.findOne({ id: title.id });

    if (!db) {
      throw new E400('Title with provided id is not found');
    }

    for (const key in title) {
      db[key] = title[key];
    }

    updateFuse();
    await db.save();

    return res.status(200).json(title);
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

export async function create(req: express.Request, res: express.Response) {
  try {
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

export async function remove(req: express.Request, res: express.Response) {
  try {
    const { id } = req.body;

    const db = await Title.findOne({ id });

    if (!db) {
      throw new E400('Title with provided id is not found');
    }

    await Title.deleteOne({ id });

    return res.status(418).json('ok');
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