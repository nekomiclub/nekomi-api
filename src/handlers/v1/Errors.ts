import fs from 'fs';
import path from 'path';
import express from 'express';

import { devMode, prodMode } from '../../config';
import { validationResult } from 'express-validator';
import axios, { AxiosError } from 'axios';
import { getUTC } from './handlers';



type THTTPErrorCodes = 400 | 401 | 403 | 404 | 500 | 501 | 503;

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

/** Route error catcher
 * Will validate HTTP Errors, express-validation & Axios errors
 * 
 * @param at Route code
 * 
 * @version re-1.0.0
 */
export async function catchError(req: express.Request, res: express.Response, at: string, cb: (req: express.Request, res: express.Response) => any | Promise<any>) {
  try {
    const valRes = validationResult(req);

    // Check validatoin
    if (!valRes.isEmpty()) {
      return res.status(400).json({ msg: 'Validation failed', errors: valRes.array() });
    }

    // Run callback
    await cb(req, res);

    // Fallback if no response provided
    try {
      res.status(200).json({ msg: 'Request fullfilled without response' });
    } catch (e) {
      null;
    }
  } catch (e) {
    const date = `${getUTC().date} ${getUTC().time}`;

    if (devMode && !(e instanceof ErrorConstructor)) console.error(e);

    if (e instanceof ErrorConstructor) {
      const emsg = `[HTTP ${e.code}]: ${e.msg}`;
      if (devMode) console.error(emsg);

      if (e.code >= 500) {
        // Write in logs
      }

      return res.status(e.code).json({ ...e, date });
    } else if (e instanceof AxiosError) {
      const date = `${getUTC().date} ${getUTC().time}`;
      const status = e.response?.status || 500;

      let emsg = `[AXIOS ${status}]: ${e.response?.data?.msg || e.response?.data?.message || e.message || 'Message is not provided'}`;
      const estack = JSON.stringify(e, Object.getOwnPropertyNames(e));

      if (status === 500) {
        emsg = `Internal server error occured or axios can not parse status. Code - ${e.code}`;
      } else if (status === 501) {
        emsg = 'Not implemented';
      } else if (status === 502) {
        emsg = 'Bad gateway';
      } else if (status === 503) {
        emsg = 'Service unavailable. Try in a few minutes';
      }

      if (devMode) console.error(emsg);
      if (devMode) console.error(JSON.stringify(e.toJSON(), null, 2));

      if (status >= 500) {
        // Write in logs
      }

      return res.status(status).json({ msg: emsg, url: e.config?.url || null, at: e.response?.data?.at || null, date });
    } else {
      const date = `${getUTC().date} ${getUTC().time}`;
      // @ts-expect-error These fields may contain
      const msg = e?.message || e?.msg;
      const emsg = `Message - ${msg || 'Unknown error occured while handling this request'}. Service may not work in near future. Please create ticket of this error in animee discord server (https://discord.gg/UmDfKTpsh5) ASAP`;
      const estack = JSON.stringify(e, Object.getOwnPropertyNames(e));

      console.log(emsg);
      console.log(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));

      // Write in logs

      return res.status(503).json({ msg: emsg, date });
    }
  }
}