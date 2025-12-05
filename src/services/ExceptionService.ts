import express from 'express';
import fs from 'fs';
import log from './LoggerService';
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

const errorsList = JSON.parse(fs.readFileSync('./errors_list.json').toString()) as Record<string, IError>[];



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



export class HTTPError extends ErrorConstructor {
  constructor(code: string) {
    const message = errorsList[code] as IError;

    if (!message) {
      const status = 500;
      const statusMessage = statusesList[status];

      super(code, 'An HTTP error occured while processing this request', status, statusMessage);
      return;
    }

    const statusMessage = statusesList[message.status] ?? statusesList[500];

    super(code, message.message, message.status, statusMessage);
  }

  /** Refine error object to POJO */
  refine() {
    return {
      status: this.status,
      error: this.error,
      message: this.message,
      code: this.code
    };
  }
}



/** 
 * Handle request errors like:
 * HTTPErrorConstructor, Axios, express-validator & uncaught
 */
export async function HandleRequest(req: express.Request, res: express.Response, cb: (req: express.Request, res: express.Response) => any | Promise<any>) {
  try {
    // Run callback
    await cb(req, res);
  } catch (e) {
    const date = `${getUTC().fulldate} UTC ${getUTC().time}`;

    // if (e instanceof HTTPError) {
    //   const emsg = `[HTTP/${e.status}]: ${e.code} - ${e.message}`;

    //   if (e.status >= 500) {
    //     Logger.error(emsg);
    //   } else {
    //     if (DevelopmentMode && !TestMode) console.log(chalk.red(emsg));
    //     if (TestMode) Logger.error(`(TESTING) ${emsg}`);
    //   }

    //   return res.status(e.status).json({ ...e, date });
    // } else if (e instanceof AxiosError) {
    //   const status = e.response?.data.status || e.status || 502;
    //   const code = e.response?.data.code || e.code || 'HTTP_ERROR';
    //   const message = e.response?.data.message || e.response?.data.msg || e.message || 'Message not provided';

    //   const emsg = `[AXIOS/${status}]: ${code} - ${message.replaceAll('127.0.0.1', 'local.addr')}`;

    //   let reqURL = e.config?.url;

    //   if (code === 'ECONNREFUSED') {
    //     const message = `[AXIOS/503]: Connection refused`;
    //     Logger.error(`[AXIOS/503]: Connection to ${reqURL} refused`);

    //     return res.status(503).json({ message, reqURL: reqURL?.replaceAll('127.0.0.1', 'local.addr'), date });
    //   } else {
    //     if (status >= 500) {
    //       Logger.error(`${emsg}. URL: ${reqURL}`);
    //     } else {
    //       if (DevelopmentMode && !TestMode) console.log(chalk.red(emsg));
    //       if (TestMode) Logger.error(`(TESTING) ${emsg}`);
    //     }
    //   }

    //   return res.status(status).json({ message: emsg, code, reqURL: reqURL?.replaceAll('127.0.0.1', 'local.addr'), date });
    // } else if (e instanceof ZodError) {
    //   if (DevelopmentMode && !TestMode) console.log(chalk.red(`Validation error`, e));

    //   return res.status(400).json({ message: 'Invalid payload, match it with endpoint documentation.', code: ERR_GENERIC.INVALID_PAYLOAD, date });
    // } else {
    //   console.error(e);

    //   const emsg = `[Uncaught]: Uncaught error occured`;
    //   Logger.error(`[Uncaught]: Uncaught error occured at HandleRequest`, e);

    //   return res.status(500).json({ message: emsg, date });
    // }

    console.error(e);

    const emsg = `[Uncaught]: Uncaught error occured`;
    log.error(`[Uncaught]: Uncaught error occured at HandleRequest`, e);

    return res.status(500).json({ message: emsg, date });
  }
}