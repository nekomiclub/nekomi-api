import fs from 'fs';
import path from 'path';
import express from 'express';
import ip from 'ip';
import axios, { AxiosError } from 'axios';
import { validationResult } from 'express-validator';

import { config, devMode, prodMode } from '../config';
import { createID, getUTC } from './handlers';



type THTTPErrorCodes = 400 | 401 | 403 | 404 | 500 | 501 | 502 | 503;

export class ErrorConstructor {
  msg: string;
  code: THTTPErrorCodes;

  constructor(msg: string, code: THTTPErrorCodes) {
    this.msg = msg;
    this.code = code;
  }
}

/** 400 - Bad request */
export class E400 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 400);
  }
}

/** 401 - Unauthorized */
export class E401 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 401);
  }
}

/** 403 - Forbidden */
export class E403 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 403);
  }
}

/** 404 - Not found */
export class E404 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 404);
  }
}

/** Internal error */
export class E500 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 500);
  }
}

/** 501 - Not implemented */
export class E501 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 501);
  }
}

/** 502 - Bad gateway */
export class E502 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 502);
  }
}

/** 503 - Service unavailable */
export class E503 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 503);
  }
}



/** Route error catcher
 * Will validate HTTP Errors, express-validation & Axios errors
 * 
 * @param preventFullfilled Prevent default response
 */
export async function catchError(req: express.Request, res: express.Response, cb: (req: express.Request, res: express.Response) => any | Promise<any>, preventFullfilled?: boolean) {
  try {
    const valRes = validationResult(req);

    // Check validation
    if (!valRes.isEmpty()) {
      return res.status(400).json({ msg: 'Validation failed', errors: valRes.array() });
    }

    // Run callback
    await cb(req, res);

    if (!preventFullfilled) {
      // Fallback if no response provided
      try {
        res.status(200).json({ msg: 'Request fullfilled without response' });
      } catch (e) {
        null;
      }
    }
  } catch (e) {
    const date = `${getUTC().date} ${getUTC().time}`;

    if (e instanceof ErrorConstructor) {
      const emsg = `[HTTP ${e.code}]: ${e.msg}`;
      if (devMode) console.error(emsg);

      if (e.code >= 500) {
        writeLog('error', emsg, 'catchError/http');
      }

      return res.status(e.code).json({ ...e, date, url: `${req.method} ${req.baseUrl}` });
    } else if (e instanceof AxiosError) {
      const date = `${getUTC().date} ${getUTC().time}`;
      const status = e.response?.status || 502;

      let emsg = `[AXIOS ${status}]: ${e.response?.data?.msg || e.response?.data?.message || e.message || 'Message is not provided'}`;
      let reqUrl = e.config?.url;

      if (status === 500) {
        emsg = `Internal server error occured. Code - ${e.code}`;
      } else if (status === 501) {
        emsg = `Not implemented. Code - ${e.code}`;
      } else if (status === 502) {
        emsg = `Bad gateway. Code - ${e.code}`;
      } else if (status === 503) {
        emsg = `Service unavailable. Try in a few minutes. Code - ${e.code}`;
      }

      if (status >= 500) {
        writeLog('error', `${emsg}; Req: ${reqUrl}; At: ${req.baseUrl}`, 'catchError/axios');

        if (reqUrl?.includes(ip.address())) {
          const id = createID();

          writeLog('debug', `Hidden local port with id - ${id}. URL - ${reqUrl}`, `catchError/axios`);
          reqUrl = `local:${id}`;
        }
      } else {
        if (reqUrl?.includes(ip.address())) {
          reqUrl = `http://local${new URL(reqUrl).pathname}`;
        }
      }

      return res.status(status).json({ msg: emsg, reqUrl, url: `${req.method} ${req.baseUrl}`, date });
    } else {
      const date = `${getUTC().date} ${getUTC().time}`;
      // @ts-expect-error These fields may be
      const msg = e?.message || e?.msg;
      const emsg = `Message - ${msg || 'Unknown error occured while handling this request'}`;

      console.log(emsg);
      console.log(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));

      writeLog('error', e, 'catchError/unexpected');

      return res.status(503).json({ msg: emsg, date, url: `${req.method} ${req.baseUrl}` });
    }
  }
}

/** Log type
 * Info - Information log
 * Warn - Warning log
 * Error - Error log
 * Fatal - Fatal error, service may not be available
 */
type TLogType = 'info' | 'warn' | 'error' | 'fatal' | 'debug'

/** Logger */
export function writeLog(type: TLogType, msg: any, at: string) {
  const date = `[${getUTC().date} ${getUTC().time}]`;
  const prefix = type === 'fatal' ? 'FATAL ERROR' : type.toUpperCase();

  const emsg = `${prefix} ${date} (at ${at}): ${JSON.stringify(msg, Object.getOwnPropertyNames(msg))}`;

  if (type === 'fatal') {
    console.log(`\nFatal error occured ----------------------------\n`);
    console.error(msg);
    console.error(`\nFatal error ended ----------------------------\n`);

    prepend(emsg, `${path.resolve()}/logs/fatal.log`);
  } else if (type === 'error') {
    console.log(`\nAn error occured ----------------------------`);
    console.error(msg);
    console.log('----------------------------');

    prepend(emsg, `${path.resolve()}/logs/error.log`);
    prepend(emsg, `${path.resolve()}/logs/.log`);
  } else {
    console.log(msg);

    prepend(emsg, `${path.resolve()}/logs/.log`);
  }
}

function prepend(data: string, path: string) {
  const rows = fs.readFileSync(path).toString().split('\n');
  rows.unshift(data);

  fs.writeFileSync(path, rows.join('\n'));
}