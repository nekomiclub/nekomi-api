import jwt from 'jsonwebtoken';
import { config } from '../config';
import { createStringID, getUTC } from '../handlers/handler';

/** Decoded token interface */
interface ITokenPayload<T = any> {
  /** Token is verified */
  verified: boolean | null

  /** Token headers */
  headers: jwt.JwtHeader | null

  /** Token payload */
  payload: T | null
}

/** JWT Headers */
const JWTHeaders = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];

/** Token methods */
type TTokenMethod = 'CSRF' | 'TelegramLink';

/** Decode JWT token.
 * @param method If specified, will also verify token with this method
 */
export function decodeToken<T = any>(token: string, method?: TTokenMethod): ITokenPayload<T> {
  try {
    const decoded = jwt.decode(token);

    let payload: any = null;
    let headers: any = null;
    let verified: any = null;

    if (typeof decoded === 'string') {
      payload = decoded;
    } else {
      for (const key in decoded) {
        if (JWTHeaders.includes(key)) {
          if (!headers) headers = {};
          headers[key] = decoded[key];
        } else {
          if (!payload) payload = {};
          payload[key] = decoded[key];
        }
      }
    }

    switch (method) {
      case 'CSRF': {
        verified = verifyCSRFToken(token);
        break;
      }
    }

    return {
      headers,
      payload,
      verified,
    };
  } catch (error) {
    return {
      headers: null,
      payload: null,
      verified: null,
    };
  }
}



/** Verify CSRF token */
export function verifyCSRFToken(token: string): boolean {
  try {
    return Boolean(jwt.verify(token, config.env.CSRF));
  } catch (e) {
    return false;
  }
}

/** Sign CSRF token */
export function signCSRFToken(): string {
  return jwt.sign({
    origin: config.DOMAIN.nekomi_core,
    expire: getUTC().timestamp + config.vars.CSRF_EXPIRE
  }, config.env.CSRF, {
    algorithm: 'RS256'
  });
}

export class TokenService {
  static signToken(method: TTokenMethod, payload?: object): string {
    let token = '';

    switch (method) {
      case 'TelegramLink': {
        token = createStringID(24);
        break;
      }
    }

    return token;
  }
}