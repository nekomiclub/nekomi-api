type THTTPErrorCodes = 200 | 400 | 401 | 403 | 404 | 500;

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

import fs from 'fs';
import path from 'path';
import express from 'express';

import { devMode } from '../../config';
import { validationResult } from 'express-validator';

export function writeErrorLog(msg: string, at: string) {
  const time = `${new Date().getUTCDate()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCFullYear()} (${new Date().getUTCHours()}:${new Date().getUTCMinutes()})`;
  const emsg = `\nERROR (UTC ${time}) [${at}]: ${msg}`;
  if (devMode) console.error(emsg);
  fs.appendFileSync(`${path.resolve()}/.log`, emsg);
}

export async function catchError(req: express.Request, res: express.Response, at: string, cb: (req: express.Request, res: express.Response) => any | Promise<any>) {
  try {
    await cb(req, res);
  } catch (e) {
    if (e instanceof ErrorConstructor) {
      devMode ? console.error(e) : null; // Console error if dev mode
      return res.status(e.code).json({ ...e });
    } else {
      // @ts-expect-error message can be in the error object
      return res.status(500).json({ name: 'E500 - Server Error', msg: `Unexpected server error occured. Please create ticket of that error: ${e?.msg || e?.message || 'msg is not provided'}`, at, code: 500 });
    }
  }
}

export function validateFields(req: express.Request) {
  const res = validationResult(req);

  // Skip if empty
  if (res.isEmpty()) {
    return;
  }

  const errors: IValidationError[] = res.array().map(el => {
    return {
      msg: el.msg || '',
      // @ts-ignore
      at: el.location,
      // @ts-ignore
      curr: el.value || 'Value is not provided'
    } as IValidationError;
  });

  throw new E400(errors);
}




interface IValidationError {
  curr: string,
  msg: string,
  at: 'body' | 'params' | 'query'
}