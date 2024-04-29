import fs from 'fs';
import path from 'path';
import express from 'express';

import { devMode, prodMode } from '../../config';
import { validationResult } from 'express-validator';
import { AxiosError } from 'axios';



type THTTPErrorCodes = 200 | 400 | 401 | 403 | 404 | 500 | 501 | 503;

export class ErrorConstructor {
  msg: string | Array<any>;
  code: THTTPErrorCodes;

  constructor(msg: string | Array<any>, code: THTTPErrorCodes) {
    this.msg = msg;
    this.code = code;
  }
}

export class E400 extends ErrorConstructor {
  constructor(msg: string | Array<any>) {
    super(msg, 400);
  }
}

export class E401 extends ErrorConstructor {
  constructor(msg: string | Array<any>) {
    super(msg, 401);
  }
}

export class E403 extends ErrorConstructor {
  constructor(msg: string | Array<any>) {
    super(msg, 403);
  }
}

export class E404 extends ErrorConstructor {
  constructor(msg: string | Array<any>) {
    super(msg, 404);
  }
}

export class E500 extends ErrorConstructor {
  constructor(msg: string | Array<any>) {
    super(msg, 500);
  }
}

export class E501 extends ErrorConstructor {
  constructor(msg: string | Array<any>) {
    super(msg, 501);
  }
}

export class E503 extends ErrorConstructor {
  constructor(msg: string | Array<any>) {
    super(msg, 503);
  }
}




export function writeErrorLog(msg: string, at: string) {
  const time = `${new Date().getUTCDate()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCFullYear()} (${new Date().getUTCHours()}:${new Date().getUTCMinutes()})`;
  const emsg = `\nERROR (UTC ${time}) [${at}]: ${msg}`;
  if (devMode) console.error(emsg);
  fs.appendFileSync(`${path.resolve()}/.log`, emsg);
}

export async function catchError(req: express.Request, res: express.Response, at: string, cb: (req: express.Request, res: express.Response) => any | Promise<any>) {
  try {
    const valRes = validationResult(req);

    const errors: IValidationError[] = valRes.array().map(el => {
      return {
        msg: el.msg || '',
        // @ts-ignore
        at: el.location,
        // @ts-ignore
        curr: el.value || 'Value is not provided'
      } as IValidationError;
    });

    if (!valRes.isEmpty()) {
      return res.status(400).json({ msg: 'Validation failed.', errors });
    }

    await cb(req, res);

    try {
      // Fallback if no response provided
      res.status(200).json({ msg: 'Request fullfilled without response' });
    } catch (e) {
      null;
    }
  } catch (e) {
    if (devMode && !(e instanceof ErrorConstructor)) console.error(e);

    if (e instanceof ErrorConstructor) {
      if (devMode) console.error(`[HTTP ${e.code}]: ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`);
      return res.status(e.code).json(e);
    } else if (e instanceof AxiosError) {
      return res.status(e.response?.status || 500).json({ msg: e.response?.data.msg || e.response?.data.message || 'Service is unavailable.', at: e.response?.data.at || null, url: e.config!.url });
    } else {
      if (prodMode) console.error(e);
      return res.status(500).json({ msg: `Unknown error occured. Error stack - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}` });
    }
  }
}

interface IValidationError {
  curr: string,
  msg: string,
  at: 'body' | 'params' | 'query'
}