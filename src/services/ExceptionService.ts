import Logger from './LoggerService';
import express from 'express';
import fs from 'fs';
import { AxiosError } from 'axios';
import { DevelopmentMode, TestMode } from '~/config';
import { ZodError } from 'zod';
import { getUTC } from '~/utils/utils';



interface IError {
  status: number
  message: string
}



const statusesList: Record<number, string> = {
  // --- Client Errors (4xx) ---
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot", // RFC 2324 (Used sometimes for fun/testing)
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',

  // --- Server Errors (5xx) ---
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

const errorsList = JSON.parse(fs.readFileSync('./src/data/errors_list.json').toString()) as Record<string, IError>[];



export class ErrorConstructor extends Error {
  constructor(
    readonly code: string,
    message?: string,
    readonly status?: number,
    readonly error?: string,
  ) {
    super(message);
  }
}



export class NekoError extends ErrorConstructor {
  constructor(code: string, message?: string) {
    const error = errorsList[code] as IError;

    if (!error) {
      const status = 500;
      const statusMessage = statusesList[status];

      super(code, 'An HTTP error occured while processing this request', status, statusMessage);
      return;
    }

    const statusMessage = statusesList[error.status] ?? statusesList[500];

    super(code, message ?? error.message, error.status, statusMessage);
  }
}



/** 
 * Handle request errors like:
 * ErrorConstructor, Axios, Zod & uncaught
 */
export async function HandleRequestError(req: express.Request, res: express.Response, callback: (req: express.Request, res: express.Response) => any | Promise<any>): Promise<boolean> {
  try {
    // Run callback
    await callback(req, res);

    return true;
  } catch (e) {
    const date = `${getUTC().fulldate} UTC ${getUTC().time}`;

    if (e instanceof ErrorConstructor) {
      res.status(e.status ?? 500).json({ message: e.message, error: e.error, code: e.code });

      return false;
    } else if (e instanceof ZodError) {
      if (DevelopmentMode && !TestMode) console.log(`Validation error`, e.errors);
      if (TestMode) Logger.error(`(TESTING) Validation error`, e.errors);

      res.status(400).json({ message: 'Invalid payload', code: 'sys:invalid_payload', errors: e.errors, date });

      return false;
    } else if (e instanceof AxiosError) {
      const status = e.response?.data.status ?? e.status ?? 502;
      const code = e.response?.data.code ?? e.code ?? 'sys:http';
      const message = e.response?.data.message ?? e.message ?? 'Message is not provided';

      const emsg = `[AXIOS (${status})]: ${code} - ${message}`;

      let reqURL = e.config?.url;

      if (code === 'ECONNREFUSED') {
        const message = `[AXIOS (503)]: Connection refused`;
        Logger.error(`[AXIOS (503)]: Connection to ${reqURL} refused`);

        res.status(503).json({ message, code, reqURL, date });

        return false;
      } else {
        if (status >= 500) {
          Logger.error(`${emsg}. URL: ${reqURL}`);
        } else {
          if (DevelopmentMode && !TestMode) console.log(emsg);
          if (TestMode) Logger.error(`(TESTING) ${emsg}`, e);
        }
      }

      res.status(status).json({ message: emsg, code, reqURL, date });

      return false;
    } else {
      const emsg = `[Uncaught]: Uncaught error occured`;
      Logger.error(`[Uncaught]: Uncaught error occured at HandleRequest`, e);

      res.status(500).json({ message: emsg, date });
    }

    return false;
  }
}