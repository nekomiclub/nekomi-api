type THTTPErrorCodes = 200 | 400 | 401 | 403 | 404 | 500;

export class ErrorConstructor {
  msg: string;
  code: THTTPErrorCodes;

  constructor(msg: string, code: THTTPErrorCodes) {
    this.msg = msg;
    this.code = code;
  }
}

export class E400 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 400);
  }
}

export class E401 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 401);
  }
}

export class E403 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 403);
  }
}

export class E404 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 404);
  }
}

export class E500 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 500);
  }
}

import fs from 'fs';
import path from 'path';
import { devMode } from '../../config';

export function writeErrorLog(msg: string, at: string) {
  const time = `${new Date().getUTCDate()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCFullYear()} (${new Date().getUTCHours()}:${new Date().getUTCMinutes()})`;
  const emsg = `\nERROR (UTC ${time}) [${at}]: ${msg}`;
  if (devMode) console.error(emsg);
  fs.appendFileSync(`${path.resolve()}/.log`, emsg);
}