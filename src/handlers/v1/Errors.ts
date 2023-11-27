type THTTPErrorCodes = 200 | 401 | 403 | 404 | 500;

export class ErrorConstructor {
  msg: string;
  code: THTTPErrorCodes;

  constructor(msg: string, code: THTTPErrorCodes) {
    this.msg = msg;
    this.code = code;
  }
}

export class E404 extends ErrorConstructor {
  constructor(msg: string) {
    super(msg, 404);
  }
}