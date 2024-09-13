import express from 'express';
import Fuse, { FuseResult } from 'fuse.js';
import * as dto from '../handlers/dtos';

import { E400, E500, catchError } from '../handlers/Errors';
import { ITitle } from '../interfaces/Title';
import Title from '../Models/Title';
import { checkValue } from '../handlers/handlers';
import Dubber from '../Models/Dubber';
import User from '../Models/User';
import { IDubber } from '../interfaces/Dubber';
import { IUser } from '../interfaces/User';
import { Logger } from '..';



let TitleSearch: Fuse<ITitle>;
let DubberSearch: Fuse<IDubber>;
let UserSeacrh: Fuse<IUser>;


/** Global search engines */
export type TSearchEngine = 'dubber' | 'user' | 'title';

/** Update Fuse instance */
export async function updateSearch(specify?: TSearchEngine) {
  const titles = await Title.find();
  const users = await User.find();
  const dubbers = await Dubber.find();

  if (specify === undefined || specify === 'title') {
    TitleSearch = new Fuse(titles.map(el => {
      let maxEp = 0;

      el.episodes.forEach(ep => {
        if (ep.order > maxEp) maxEp = ep.order;
      });

      return {
        ...dto.title(el.toObject()),
        episodesDubbed: maxEp
      };
    }), {
      keys: ['names.eng', 'names.ukr', 'names.alt', 'code', 'id'],
      includeScore: true
    });
  }

  if (specify === undefined || specify === 'dubber') {
    DubberSearch = new Fuse(dubbers.map(el => dto.dubber(el.toObject())), {
      keys: ['code', 'id', 'name'],
      includeScore: true
    });
  }

  if (specify === undefined || specify === 'user') {
    UserSeacrh = new Fuse(users.map(el => dto.user(el.toObject())), {
      keys: ['id', 'username'],
      includeScore: true
    });
  }

  Logger.info(`[RootController/Search]: Search ${specify ? `(${specify} engine only)` : '(all engines)'} updated`);
}

interface ISearchQuery {
  /** Query (names, id, code) */
  q?: string

  /** Results limit
   * @default 30
   */
  limit?: number

  /** Results page
   * @default 0
   */
  page?: number

  /** Included search engines */
  engines?: TSearchEngine[]
}

/** Extended gloabl search result object with it's type */
export interface ISearchExtended<T = any> {
  type: TSearchEngine
  item: T
}

/** @see /docs/routes/root.md */
export async function getSearch(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const { q } = req.query as ISearchQuery;
    let { limit, page, engines } = req.query as ISearchQuery;

    let results: (ISearchExtended<IDubber> | ISearchExtended<ITitle> | ISearchExtended<IUser>)[] = [];
    let rawResults: (ISearchExtended<FuseResult<IDubber>> | ISearchExtended<FuseResult<IUser>> | ISearchExtended<FuseResult<ITitle>>)[] = [];
    let totalResults = 0;

    limit = checkValue(limit, { notNaN: true, maxLength: 100, minLength: 1 }) ? +limit! : 30;
    page = checkValue(page, { notNaN: true, minLength: 0 }) ? +page! : 0;

    if (q === undefined || engines === undefined) throw new E400('Can not search without specified query or engines');

    try {
      // @ts-ignore
      engines = JSON.parse(engines as string);
    } catch (e) {
      throw new E400('An error occured while parsing search engines');
    }

    engines = engines || [];

    const getManyMode = q === '*';

    if (getManyMode) {
      if (engines[0] === 'title') {
        const titles = (await Title.find()).map(el => dto.title(el.toObject()));

        titles.forEach(el => {
          const result: ISearchExtended<FuseResult<ITitle>> = {
            type: 'title',
            item: {
              item: el,
              score: 0,
              refIndex: 0
            }
          };

          rawResults.push(result);
        });
      }
    } else {
      try {
        if (engines?.includes('title')) {
          const matches = TitleSearch.search(q);

          matches.forEach(match => rawResults.push({ type: 'title', item: match }));
        }

        if (engines?.includes('dubber')) {
          const matches = DubberSearch.search(q);

          matches.forEach(match => rawResults.push({ type: 'dubber', item: match }));
        }

        if (engines?.includes('user')) {
          const matches = UserSeacrh.search(q);

          matches.forEach(match => rawResults.push({ type: 'user', item: match }));
        }
      } catch (e) {
        throw new E400('Search is not ready yet. Try in a few minutes');
      }
    }

    rawResults = rawResults.sort((a, b) => a.item.score! - b.item.score!);
    totalResults = rawResults.length;

    const croppedResults: any[][] = [];

    while (rawResults.length > limit) {
      croppedResults.push(rawResults.splice(0, limit));
    }

    croppedResults.push(rawResults);
    rawResults = croppedResults[page] || [];

    rawResults.forEach(el => {
      const result: ISearchExtended = {
        item: el.item.item,
        type: el.type
      };

      results.push(result);
    });

    return res.status(200).json({ msg: 'ok', results, totalResults });
  });
}