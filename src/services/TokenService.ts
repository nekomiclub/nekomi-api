import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { prodMode } from '../config';

//! Token signing is not implemented

/** 
 * session - Session method, key stored in SECRETS.session
 * dummy_googleProvider - Test only method
 */
export type TTokenMethod = '';

interface ITokenPayload<T> {
  /** Can be null if method not provided */
  verified: boolean | null

  /** Token headers */
  headers: jwt.JwtHeader | null

  /** Token payload */
  payload: T
}


// const SECRETS = {
//   session: (JSON.parse(fs.readFileSync(`${path.resolve()}/secrets/sessionKey.json`).toString()) as ISEC_SessionKey).key,
//   dummy_googleProvider: `dummy_googleProvider`
// };

const JWTHeaders = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];

/** Sign JWT token */
// export function signToken(method: TTokenMethod, payload: any): string {
//   if (method === 'session') {
//     return jwt.sign(payload, SECRETS.session);
//   } else if (method === SECRETS.dummy_googleProvider) {
//     return jwt.sign(payload, method, {
//       expiresIn: '30m'
//     });
//   } else {
//     throw new Error('Method is invalid');
//   }
// }

/** Decode JWT token. If method is present will also verify token */
export function decodeToken<T = any>(token: string, method?: TTokenMethod): ITokenPayload<T> {
  try {
    const decoded = jwt.decode(token);
    let payload: any = {};
    let headers: any = {};
    let verified: boolean | null = null;

    if (typeof decoded === 'string') {
      payload = decoded;
    } else {
      for (const key in decoded) {
        if (!JWTHeaders.includes(key)) {
          payload[key] = decoded[key];
        } else {
          headers[key] = decoded[key];
        }
      }
    }

    // if (method) {
    //   verified = verifyToken(token, method);
    // }

    return {
      headers,
      payload,
      verified
    };
  } catch (e) {
    const emsg = `An error occured while decoding token: ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`;

    if (!prodMode) console.error(`DEV_ERR: ${emsg}`);
    throw new Error(emsg);
  }
}

/** Verify JWT token with provided method */
// export function verifyToken<T = any>(token: string, method: TTokenMethod): boolean {
//   try {
//     if (method === 'session') {
//       return Boolean(jwt.verify(token, SECRETS.session));
//     } else if (method === SECRETS.dummy_googleProvider) {
//       return Boolean(jwt.verify(token, method));
//     } else {
//       throw new Error();
//     }
//   } catch (e) {
//     return false;
//   }
// }