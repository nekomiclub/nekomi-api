import jwt, { JwtPayload } from 'jsonwebtoken';
import { IJWTokenPayload } from '~/intf/types';
import { NekoError } from './ExceptionService';



export enum TOKEN_METHOD {

}



class TokenServiceClass {
  /** 
   * Sign token
   */
  sign<T extends object>(method: TOKEN_METHOD, payload: T): string {
    // if (method === TOKEN_METHOD.SESSION) {
    //   return jwt.sign(payload, config.env.SessionKey, {
    //     issuer: config.URL.fullkekw_userapi,
    //     audience: 'fullkekw-userapi'
    //   });
    // }

    throw new NekoError('sys:type_invalid', `Method (${method}) is invalid`);
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
    const payload = jwt.decode(token) as JwtPayload & T;
    if (typeof payload !== 'object') throw new NekoError('sys:type_invalid', `Token data type is invalid`);

    return {
      verified: null,
      payload,
    };
  }



  /** 
   * Verify token with method
   */
  verify(token: string, method: TOKEN_METHOD): boolean {
    try {
      // if (method === TOKEN_METHOD.SESSION) {
      //   return Boolean(jwt.verify(token, config.env.SessionKey));
      // }

      throw new NekoError('sys:type_invalid', `Method (${method}) is invalid`);
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