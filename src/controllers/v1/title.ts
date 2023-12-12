import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog } from '../../handlers/v1/Errors';
import { randomNumber } from '../../handlers/v1/handlers';
import Storage from '../../Models/Storage';
import fs from 'fs';
import { ITitle } from '../../core/interfaces';
import { validationResult } from 'express-validator';
import type { ValidationError } from 'express-validator';
import * as uuid from 'uuid';
import Title from '../../Models/Title';
import * as dto from '../../handlers/v1/dtos';
import { testMode, devMode } from '../../config';

export async function getOne(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;

    const db = await Title.findOne({ id });

    if (!db) {
      throw new E400('Title with provided id is not found');
    }

    // @ts-ignore
    let item: ITitle = dto.title(db);

    return res.status(200).json(item);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }
}

export async function search(req: express.Request, res: express.Response) {
  try {
    // @ts-ignore
    const { ageRate, code, country, id, genres, names, season, estimatedEps, rating, status, type, year, studios } = req.query as ITitle;

    const items = await Title.find({ year, country: 'null' });

    return res.status(200).json(dto.title(items[randomNumber(0, items.length - 1)]!));
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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

    await db.save();

    return res.status(200).json(title);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
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
      console.error(e);
      return res.status(e.code).json(e);
    } else {
      console.error(e);
      return res.status(500).json(e);
    }
  }
}