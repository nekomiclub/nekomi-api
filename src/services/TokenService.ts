import conf from '~/conf.js';
import env from '~/utils/env.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IJWTokenPayload } from '~/interfaces/types.js';
import { NekoError } from './ExceptionService.js';



export enum TOKEN_METHOD {
  USER_SESSION_TOKEN = 'user:session_token'
}



class TokenServiceClass {
  /** 
   * Sign token
   */
  sign<T extends object>(method: TOKEN_METHOD, payload: T): string {
    if (method === TOKEN_METHOD.USER_SESSION_TOKEN) {
      return jwt.sign(payload, env('USER_SESSION_SK'), {
        expiresIn: conf.variables.SESSION_COOKIE_MAX_AGE_MS / 1000
      });
    }

    throw new NekoError('sys:type_invalid', `JWT sign method (${method}) is invalid`);
  }



  /** 
   * Decode & Verify token
   */
  parse<T = object>(token: string, method: TOKEN_METHOD): IJWTokenPayload<T> {
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
  decode<T = object>(token: string): IJWTokenPayload<T> {
    try {
      const payload = (jwt.decode(token) ?? {}) as JwtPayload & T;
      if (typeof payload !== 'object') throw new NekoError('sys:type_invalid', `JWT token data is invalid`);

      return {
        verified: null,
        payload,
      };
    } catch (e) {
      throw new NekoError(`sys:invalid_payload`, `JWT token data is invalid`);
    }
  }



  /** 
   * Verify token with method
   */
  verify(token: string, method: TOKEN_METHOD): boolean {
    try {
      if (method === TOKEN_METHOD.USER_SESSION_TOKEN) return Boolean(jwt.verify(token, env('USER_SESSION_SK')));

      throw new NekoError('sys:type_invalid', `JWT verify method (${method}) is invalid`);
    } catch (e) {
      return false;
    }
  }



  /** 
   * Verify token using provided secret
   */
  verifySecret(token: string, secret: string) {
    try {
      return Boolean(jwt.verify(token, secret));
    } catch (e) {
      return false;
    }
  }
}



const TokenService = new TokenServiceClass();

export default TokenService;