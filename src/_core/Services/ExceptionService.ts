import fs from 'fs';



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

  refine() {
    return {
      status: this.status,
      error: this.error,
      message: this.message,
      code: this.code
    };
  }
}