import express from 'express';
import { validationResult } from 'express-validator';
import { addZeroIfNumberSingle, getUTC } from '../handlers/handler';
import axios, { AxiosError } from 'axios';
import ip from 'ip';

import { devMode } from '../config';
import chalk from 'chalk';
import { Logger } from './LoggerService';
import { TMiddlewareName } from './MiddlewareService';

export const HTTP_ERROR_CORES = [400, 401, 403, 404, 418, 500, 501, 502, 503] as const;
export type THTTPErrorCode = typeof HTTP_ERROR_CORES[number];

export class HTTPErrorConstructor {
  message: string;
  /** @deprecated back resolve purposes */
  msg: string;
  status: THTTPErrorCode;
  code: string;

  constructor({ message, status, code }: { message: string, status: THTTPErrorCode, code?: string }) {
    this.message = message;
    this.msg = this.message;
    this.status = status;
    this.code = code || 'HTTP_ERROR';
  }
}

/** HTTP_BAD_REQUEST */
export class E400 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 400, code: code || 'HTTP_BAD_REQUEST' });
  }
}

/** HTTP_NOT_AUTHORIZED */
export class E401 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 401, code: code || 'HTTP_NOT_AUTHORIZED' });
  }
}

/** HTTP_FORBIDDEN */
export class E403 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 403, code: code || 'HTTP_FORBIDDEN' });
  }
}

/** HTTP_NOT_FOUND */
export class E404 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 404, code: code || 'HTTP_NOT_FOUND' });
  }
}

/** HTTP_TEAPOT */
export class E418 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 418, code: code || 'HTTP_TEAPOT' });
  }
}

/** HTTP_INTERNAL */
export class E500 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 500, code: code || 'HTTP_INTERNAL' });
  }
}

/** HTTP_NOT_IMPLEMENTED */
export class E501 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 501, code: code || 'HTTP_NOT_IMPLEMENTED' });
  }
}

/** HTTP_BAD_GATEWAY */
export class E502 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 502, code: code || 'HTTP_BAD_GATEWAY' });
  }
}

/** HTTP_SERVICE_UNAVAILABLE */
export class E503 extends HTTPErrorConstructor {
  constructor(message: string, code?: string) {
    super({ message, status: 503, code: code || 'HTTP_SERVICE_UNAVAILABLE' });
  }
}



/** Handle request errors like
 * HTTPErrorConstructor, Axios, express-validator & uncaught
 * 
 * @param preventFullfilled prevent default fullfilled response
 */
export async function HandleRequest(req: express.Request, res: express.Response, cb: () => any | Promise<any>, preventFullfilled?: boolean) {
  try {
    const validation = validationResult(req);

    // Check validation
    if (!validation.isEmpty()) {
      throw new ERR_INVALID_PAYLOAD();
    }

    // Run callback
    await cb();

    if (!preventFullfilled) {
      try {
        res.status(204).json({ message: 'Request fullfilled' });
      } catch (e) { null; }
    }
  } catch (e) {
    const date = `${getUTC().fulldate} UTC-0 ${getUTC().time}.${addZeroIfNumberSingle(getUTC().secs)}`;

    if (e instanceof HTTPErrorConstructor) {
      const emsg = `[HTTP/${e.status}]: ${e.code} - ${e.message}`;

      if (e.status >= 500) {
        Logger.error(emsg);
      } else {
        if (devMode) console.log(chalk.red(emsg));
      }

      return res.status(e.status).json({ ...e, date });
    } else if (e instanceof AxiosError) {
      const status = e.response?.data.status || e.status || 502;
      const code = e.response?.data.code || e.code || 'HTTP_ERROR';
      const message = e.response?.data.message || e.response?.data.msg || e.message || 'Message not provided';

      const emsg = `[AXIOS/${status}]: ${code} - ${message.replaceAll(ip.address(), 'local.addr')}`;

      let reqURL = e.config?.url;

      if (code === 'ECONNREFUSED') {
        const message = `[AXIOS/503]: Connection refused`;
        Logger.error(`[AXIOS/503]: Connection to ${reqURL} refused`);

        return res.status(503).json({ msg: message, message, reqURL: reqURL?.replaceAll(ip.address(), 'local.addr'), date });
      } else {
        if (status >= 500) {
          Logger.error(`${emsg}. URL: ${reqURL}`);
        } else {
          if (devMode) console.log(chalk.red(emsg));
        }
      }

      return res.status(status).json({ message: emsg, msg: emsg, code, reqURL: reqURL?.replaceAll(ip.address(), 'local.addr'), date });
    } else {
      console.error(e);

      const emsg = `[Uncaught]: Uncaught error occured. Behaivour reported`;
      Logger.error(`[Uncaught]: Uncaught error occured at HandleRequest`, e);

      return res.status(500).json({ msg: emsg, message: emsg, date });
    }
  }
}



//* --------------- DEFAULT EXCEPTIONS ---------------
export class ERR_INVALID_PAYLOAD extends E400 {
  constructor(message?: string) {
    super(message || 'Invalid payload. Match payload with endpoint documentation.', 'ERR_INVALID_PAYLOAD');
  }
}

export class ERR_TYPE_INVALID extends E400 {
  constructor(message?: string) {
    super(message || 'Value type invalid. Match it`s type with endpoint documentation.', 'ERR_TYPE_INVALID');
  }
}

export class ERR_ALREADY_EXIST extends E400 {
  constructor(message?: string) {
    super(message || 'Object already exist, new one can not be created.', 'ERR_ALREADY_EXIST');
  }
}

export class ERR_LENGTH_INVALID extends E400 {
  constructor(message?: string) {
    super(message || 'Length is out of range.', 'ERR_LENGTH_INVALID');
  }
}

export class ERR_NOT_READY extends E418 {
  constructor(message?: string) {
    super(message || 'Endpoint response is not ready yet, try in a few minutes.', 'ERR_NOT_READY');
  }
}

export class ERR_MISSING_AUTHORIZATION extends E404 {
  constructor(message?: string) {
    super(message || 'Authorization cookie/header is missing.', 'ERR_MISSING_AUTHORIZATION');
  }
}

export class ERR_ACCESS_REJECTED extends E403 {
  constructor(message?: string) {
    super(message || 'You are not allowed to have access for that.', 'ERR_ACCESS_REJECTED');
  }
}

export class ERR_MIDDLEWARE_REQUIRED extends E500 {
  constructor(middleware: TMiddlewareName) {
    super(`Request not passed throught ${middleware} middleware and being rejected`, 'ERR_MIDDLEWARE_REQUIRED');
  }
}