import Fuse, { FuseResult } from 'fuse.js';
import express from 'express';

import Dubber from '../Models/Dubber';
import Title from '../Models/Title';
import User from '../Models/User';
import { $upload } from '~/Services/HTTPService';
import { AxiosError } from 'axios';
import { E503, ERR_INVALID_PAYLOAD, ERR_MIDDLEWARE_REQUIRED, ERR_NOT_READY, HandleRequest } from '../Services/ErrorService';
import { IA_UploadsUpload, NEKOMI_UPLOADS } from '../Interfaces/http/Uploads';
import { IDubber } from '~/core/Interfaces/IDubber';
import { ITitle } from '../Interfaces/Title';
import { IUser } from '../Interfaces/User';
import { Logger } from '../Services/LoggerService';
import { MongoDocumentDTO } from '~/core/Services/DTO';
import { checkValue } from '../handlers/handlers';
import { config } from '../config';



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
        ...new MongoDocumentDTO().anime({ document: el }),
        episodesDubbed: maxEp
      };
    }), {
      keys: ['names.eng', 'names.ukr', 'names.alt', 'code', 'id'],
      includeScore: true
    });
  }

  if (specify === undefined || specify === 'dubber') {
    DubberSearch = new Fuse(dubbers.map(el => new MongoDocumentDTO().dubber({ document: el })), {
      keys: ['code', 'id', 'name'],
      includeScore: true
    });
  }

  if (specify === undefined || specify === 'user') {
    UserSeacrh = new Fuse(users.map(el => new MongoDocumentDTO().user({ document: el })), {
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

export async function getPing(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    return res.status(200).json({
      message: 'pong!',
      commit: config.commit,
      startedAt: config.startedAt
    });
  });
}


/** @see /docs/routes/root.md */
export async function getSearch(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const { q } = req.query as ISearchQuery;
    let { limit, page, engines } = req.query as ISearchQuery;

    let results: (ISearchExtended<IDubber> | ISearchExtended<ITitle> | ISearchExtended<IUser>)[] = [];
    let rawResults: (ISearchExtended<FuseResult<IDubber>> | ISearchExtended<FuseResult<IUser>> | ISearchExtended<FuseResult<ITitle>>)[] = [];
    let totalResults = 0;

    limit = checkValue(limit, { notNaN: true, maxLength: 100, minLength: 1 }) ? +limit! : 30;
    page = checkValue(page, { notNaN: true, minLength: 0 }) ? +page! : 0;

    if (q === undefined || engines === undefined) throw new ERR_INVALID_PAYLOAD('Can not search without specified query or engines');

    try {
      // @ts-ignore
      engines = JSON.parse(engines as string);
    } catch (e) {
      throw new ERR_INVALID_PAYLOAD('An error occured while parsing search engines');
    }

    engines = engines || [];

    const getManyMode = q === '*';

    if (getManyMode) {
      if (engines[0] === 'title') {
        const titles = (await Title.find()).map(el => new MongoDocumentDTO().anime({ document: el }));

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
        throw new ERR_NOT_READY();
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

export async function postUpload(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');

    const userID = req.nekomi.user?.id;

    const file = req.file;
    if (!file) throw new ERR_INVALID_PAYLOAD('File is not provided');

    const { type } = req.body as { type: string };
    const { buffer, originalname, filename, mimetype } = file;
    const formData = new FormData();

    const UPLOAD_DATA: { url: string, id: string, srt_id?: string, frames?: number } = {
      url: '',
      id: '',
    };

    formData.append('file', new Blob([buffer], {
      type: mimetype
    }), originalname);
    formData.set('uploadedBy', userID);
    formData.set('qualities', JSON.stringify([1080]));
    formData.set('type', type);

    try {
      const { data: postData } = await $upload.post<IA_UploadsUpload>(NEKOMI_UPLOADS.upload, formData);
      UPLOAD_DATA.url = postData.url;
      UPLOAD_DATA.id = postData.id;
      UPLOAD_DATA.frames = postData.frames;
      UPLOAD_DATA.srt_id = postData.srt_id;
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') {
          throw new E503('Nekomi-uploads is not available. Try in a few minutes');
        }

        throw e;
      } else {
        throw e;
      }
    }

    return res.status(201).json({ message: `File with type ${type} uploaded`, ...UPLOAD_DATA });
  });
}

export async function deleteUpload(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');

    const { id } = req.params as { id: string };
    const userID = req.nekomi.user?.id;

    try {
      await $upload.delete(NEKOMI_UPLOADS.delete_upload(id), {
        params: {
          by: userID,
          withChildren: true
        }
      });
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') {
          throw new E503('Nekomi-uploads is not available. Try in a few minutes');
        }

        throw e;
      } else {
        throw e;
      }
    }

    return res.status(201).json({ message: `Upload removed`, });
  });
}