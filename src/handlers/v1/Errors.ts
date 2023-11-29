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