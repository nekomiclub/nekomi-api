import jwt, { JwtPayload } from 'jsonwebtoken';
import { ERROR_TOKEN_DATATYPE_INVALID, ERROR_TOKEN_METHOD_INVALID } from './Exceptions';
import { config } from '~/config';
import { createStringID } from '~/utils/utils';
import { getUTC } from '~/utils/utils';



export enum TOKEN_METHOD {
  TELEGRAM_LINK = 'telegram:link'
}



export interface TokenPayload<T = object> {
  payload: JwtPayload & T

  /** Will be null if verify method is not specified */
  verified: boolean | null
}



export default class TokenService {
  /** 
   * Sign token
   */
  static sign<T extends object>(method: TOKEN_METHOD, payload: T): string {
    if (method === TOKEN_METHOD.TELEGRAM_LINK) {
      return createStringID(24);
    }

    throw ERROR_TOKEN_METHOD_INVALID;
  }



  /** 
   * Decode & Verify token
   */
  static parse<T = object>(token: string, method: TOKEN_METHOD): TokenPayload<T> {
    const { payload } = this.decode<T>(token);
    const verified = this.verify(token, method);

    return {
      payload,
      verified
    };
  }



  /** 
   * Decode token
   */
  static decode<T = object>(token: string): TokenPayload<T> {
    const payload = jwt.decode(token) as JwtPayload & T;
    if (typeof payload !== 'object') throw ERROR_TOKEN_DATATYPE_INVALID;

    return {
      verified: null,
      payload,
    };
  }



  /** 
   * Verify token with method
   * 
   * @returns boolean verify state
   */
  static verify(token: string, method: TOKEN_METHOD): boolean {
    try {
      // if (method === TOKEN_METHOD.SESSION) {
      //   return Boolean(jwt.verify(token, config.secrets.SessionKey));
      // }

      throw ERROR_TOKEN_METHOD_INVALID;
    } catch (e) {
      return false;
    }
  }

  /** Sign CSRF token */
  static signCSRF(): string {
    return jwt.sign({
      origin: config.DOMAIN.nekomiApi,
      expire: getUTC().timestamp + config.vars.CSRF_EXPIRE
    }, config.env.CSRF, {
      algorithm: 'RS256'
    });
  }
}