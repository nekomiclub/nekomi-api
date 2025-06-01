import express from 'express';
import getUTC from '~/utils/get-utc';
import { AxiosError } from 'axios';

import { validationResult } from 'express-validator';

import chalk from 'chalk';
import { DevelopmentMode, TestMode, config } from '~/config';
import { Logger } from './LoggerService';
import { TMiddlewareName } from './MiddlewareService';
import { ZodError } from 'zod';



export enum ERR {
  HTTP_ERROR = 'http:error',
  HTTP_BAD_REQUEST = 'http:bad_request',
  HTTP_UNAUTHORIZED = 'http:unauthorized',
  HTTP_FORBIDDEN = 'http:forbidden',
  HTTP_NOT_FOUND = 'http:not_found',
  HTTP_INTERNAL_ERROR = 'http:internal_error',
  HTTP_NOT_IMPLEMENTED = 'http:not_implemented',
  HTTP_BAD_GATEWAY = 'http:bad_gateway',
  HTTP_NOT_AVAILABLE = 'http:not_available',

  BASE_INVALID_PAYLOAD = 'base:invalid_payload',
  BASE_MIDDLEWARE_REQUIRED = 'base:middleware_required',
  BASE_TYPE_INVALID = 'base:type_invalid',
  BASE_ALREADY_EXIST = 'base:already_exist',
  BASE_MOCK_UNDEFINED = 'base:mock_undefined',

  AUTH_SESSION_EXPIRED = 'auth:session_expired',
  AUTH_CSRF_INVALID = 'auth:csrf_invalid',
}

export const ERRORS: Record<ERR, string> = {
  [ERR.HTTP_ERROR]: 'An error occured while processing this request',
  [ERR.HTTP_BAD_REQUEST]: 'Invalid data passed',
  [ERR.HTTP_UNAUTHORIZED]: 'Authorization missed',
  [ERR.HTTP_FORBIDDEN]: 'Access forbidden',
  [ERR.HTTP_NOT_FOUND]: 'Content not found',
  [ERR.HTTP_INTERNAL_ERROR]: 'Internal server error',
  [ERR.HTTP_NOT_IMPLEMENTED]: 'Method not implemented yet',
  [ERR.HTTP_BAD_GATEWAY]: 'An error occured while processing this request to another service',
  [ERR.HTTP_NOT_AVAILABLE]: 'Something not available for now. Try again later',

  [ERR.BASE_INVALID_PAYLOAD]: 'Payload not match requirements',
  [ERR.BASE_MIDDLEWARE_REQUIRED]: 'Request does not pass throught required middleware and being rejected',
  [ERR.BASE_TYPE_INVALID]: 'Some types are invalid',
  [ERR.BASE_ALREADY_EXIST]: 'Something already exist',
  [ERR.BASE_MOCK_UNDEFINED]: 'Mock data was not passed into function',

  [ERR.AUTH_SESSION_EXPIRED]: 'Your session has been expired. Re-login in fullkekw-sso',
  [ERR.AUTH_CSRF_INVALID]: 'CSRF token invalid',
};


type HTTPStatus = 400 | 401 | 403 | 404 | 500 | 501 | 502 | 503;



export class HTTPErrorConstructor {
  message: string;
  status: HTTPStatus;
  code: ERR | string;

  constructor({ message, status, code }: { message?: string, status: HTTPStatus, code?: ERR | string }) {
    const emsg = code ? ERRORS[code] : undefined;
    let result_message = '';

    if (emsg?.length) result_message += emsg;
    if (message?.length) result_message += ': ' + message;

    this.message = result_message;
    this.status = status;
    this.code = code ?? ERR.HTTP_ERROR;
  }
}



/** HTTP_BAD_REQUEST */
export class E400 extends HTTPErrorConstructor {
  constructor(message?: string, code?: ERR | string) {
    super({ message, status: 400, code: code ?? ERR.HTTP_BAD_REQUEST });
  }
}

/** HTTP_NOT_AUTHORIZED */
export class E401 extends HTTPErrorConstructor {
  constructor(message?: string, code?: ERR | string) {
    super({ message, status: 401, code: code ?? ERR.HTTP_UNAUTHORIZED });
  }
}

/** HTTP_FORBIDDEN */
export class E403 extends HTTPErrorConstructor {
  constructor(message?: string, code?: ERR | string) {
    super({ message, status: 403, code: code ?? ERR.HTTP_FORBIDDEN });
  }
}

/** HTTP_NOT_FOUND */
export class E404 extends HTTPErrorConstructor {
  constructor(message?: string, code?: ERR | string) {
    super({ message, status: 404, code: code ?? ERR.HTTP_NOT_FOUND });
  }
}

/** HTTP_INTERNAL */
export class E500 extends HTTPErrorConstructor {
  constructor(message?: string, code?: ERR | string) {
    super({ message, status: 500, code: code ?? ERR.HTTP_INTERNAL_ERROR });
  }
}

/** HTTP_NOT_IMPLEMENTED */
export class E501 extends HTTPErrorConstructor {
  constructor(message?: string, code?: ERR | string) {
    super({ message, status: 501, code: code ?? ERR.HTTP_NOT_IMPLEMENTED });
  }
}

/** HTTP_BAD_GATEWAY */
export class E502 extends HTTPErrorConstructor {
  constructor(message?: string, code?: ERR | string) {
    super({ message, status: 502, code: code ?? ERR.HTTP_BAD_GATEWAY });
  }
}

/** HTTP_SERVICE_UNAVAILABLE */
export class E503 extends HTTPErrorConstructor {
  constructor(message?: string, code?: ERR | string) {
    super({ message, status: 503, code: code ?? ERR.HTTP_NOT_AVAILABLE });
  }
}



/** 
 * Handle request errors like:
 * HTTPErrorConstructor, Axios, express-validator & uncaught
 */
export async function HandleRequest(req: express.Request, res: express.Response, cb: (req: express.Request, res: express.Response) => any | Promise<any>) {
  try {
    const validation = validationResult(req);

    // Check validation
    if (!validation.isEmpty()) throw new ERR_INVALID_PAYLOAD();

    // Run callback
    await cb(req, res);
  } catch (e) {
    const date = `${getUTC().fulldate} UTC-0 ${getUTC().time}.${String(getUTC().secs).padStart(2, '0')}`;

    if (e instanceof HTTPErrorConstructor) {
      const emsg = `[HTTP/${e.status}]: ${e.code} - ${e.message}`;

      if (e.status >= 500) {
        Logger.error(emsg);
      } else {
        if (DevelopmentMode && !TestMode) console.log(chalk.red(emsg));
        if (TestMode) Logger.error(`(TESTING) ${emsg}`);
      }

      return res.status(e.status).json({ ...e, date });
    } else if (e instanceof AxiosError) {
      const status = e.response?.data.status || e.status || 502;
      const code = e.response?.data.code || e.code || 'HTTP_ERROR';
      const message = e.response?.data.message || e.response?.data.msg || e.message || 'Message not provided';

      const emsg = `[AXIOS/${status}]: ${code} - ${message.replaceAll('127.0.0.1', 'local.addr')}`;

      let reqURL = e.config?.url;

      if (code === 'ECONNREFUSED') {
        const message = `[AXIOS/503]: Connection refused`;
        Logger.error(`[AXIOS/503]: Connection to ${reqURL} refused`);

        return res.status(503).json({ msg: message, message, reqURL: reqURL?.replaceAll('127.0.0.1', 'local.addr'), date });
      } else {
        if (status >= 500) {
          Logger.error(`${emsg}. URL: ${reqURL}`);
        } else {
          if (DevelopmentMode && !TestMode) console.log(chalk.red(emsg));
          if (TestMode) Logger.error(`(TESTING) ${emsg}`);
        }
      }

      return res.status(status).json({ message: emsg, code, reqURL: reqURL?.replaceAll('127.0.0.1', 'local.addr'), date });
    } else if (e instanceof ZodError) {
      if (DevelopmentMode && !TestMode) console.log(chalk.red(`Validation error`, e));

      return res.status(400).json({ message: 'Invalid payload, match it with endpoint documentation.', code: ERR_GENERIC.INVALID_PAYLOAD, date });
    } else {
      console.error(e);

      const emsg = `[Uncaught]: Uncaught error occured`;
      Logger.error(`[Uncaught]: Uncaught error occured at HandleRequest`, e);

      return res.status(500).json({ message: emsg, date });
    }
  }
}



//* --------------- DEFAULT EXCEPTIONS ---------------
export class ERR_INVALID_PAYLOAD extends E400 {
  constructor(message?: string) {
    super(message || 'Invalid payload, match it with endpoint documentation.', 'ERR_INVAID_PAYLOAD');
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

export class ERR_MIDDLEWARE_REQUIRED extends E500 {
  constructor(middleware: TMiddlewareName) {
    super(`Request does not pass throught ${middleware} middleware and being rejected`, ERR.BASE_MIDDLEWARE_REQUIRED);
  }
}






//* ========= GENERIC
export enum ERR_GENERIC {
  LINK_INVALID = 'generic:link_invalid',
  USERNAME_LENGTH_INVALID = 'generic:username_length_invalid',
  USERNAME_NOT_LATIN = 'generic:username_not_latin',
  DESCRIPTION_LENGTH_INVALID = 'generic:description_length_invalid',
  INVALID_PAYLOAD = 'generic:invalid_payload',
  MISSING_AUTHORIZATION = 'generic:missing_authorization',
}

export const ERR_USERNAME_LENGTH_INVALID = new E400(`Username must be in range between ${config.VALIDATION.CreateUser.minNameLength} and ${config.VALIDATION.CreateUser.maxNameLength} symbols`, ERR_GENERIC.USERNAME_LENGTH_INVALID);
export const ERR_USERNAME_NOT_LATIN = new E400(`Username must contain only latin characters`, ERR_GENERIC.USERNAME_NOT_LATIN);

export const ERR_DESCRIPTION_LENGTH_INVALID = new E400(`Description must be shorter than ${config.VALIDATION.PatchTitle.maxDescriptionLength} symbols`, ERR_GENERIC.DESCRIPTION_LENGTH_INVALID);

export const ERR_LINK_INVALID = new E400(`Link was parsed with error, domain is not valid or it's length is above 256 chars`, ERR_GENERIC.LINK_INVALID);
export const ERR_NO_DOCUMENT = new E500(`No document is passed into the constructor`, 'generic:no_document');
export const ERR_FILE_TOO_LARGE = new E400(`Uploaded file size is too large`, 'generic:file_too_large');



//* ========= DUBBER
export const ERR_DUBBER_OTHER_TEAM_MEMBER = new E400(`User is already take part in another dubber team`, 'dubber:other_team_member');

export const ERR_DUBBER_NOT_INVITED = new E400(`User is not invited in the dubber team`, 'dubber:not_invited');
export const ERR_DUBBER_ALREADY_INVITED = new E400(`User is already invited in the dubber team`, 'dubber:already_invited');

export const ERR_DUBBER_MEMBER_ALREADY = new E400(`User is already member of the dubber team`, 'dubber:member_already');
export const ERR_DUBBER_NOT_MEMBER = new E400(`User is not a member of the team`, 'dubber:not_member');



//* ========= ANIME



//* ========= USER
export const ERR_USER_TELEGRAM_NOT_LINKED = new E400(`User does not link telegram`, 'user:telegram_not_linked');