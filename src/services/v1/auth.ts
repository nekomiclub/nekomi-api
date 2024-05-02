import jwt from 'jsonwebtoken';
import { config, userDefaultRoles } from '../../config';
import { TUserRoles } from '../../core/IUser';
interface ITokenPayload {
  username: string,
  roles: TUserRoles[],
  uid: string
}

/** @deprecated */
export function signTokens(payload: ITokenPayload): { accessToken: string, refreshToken: string } {
  return {
    accessToken: jwt.sign(payload, config.secrets.jwtAccess, { expiresIn: '15m' }),
    refreshToken: jwt.sign(payload, config.secrets.jwtRefresh, { expiresIn: '30d' })
  };
}

/** @deprecated */
export function verify(token: string, method: 'access' | 'refresh'): boolean {
  try {
    jwt.verify(token, method === 'access' ? config.secrets.jwtAccess : config.secrets.jwtRefresh);
    return true;
  } catch (e) {
    return false;
  }
}

/** @deprecated */
export function decode(token: string): ITokenPayload | null {
  const decoded = jwt.decode(token) as ITokenPayload | null;

  if (!decoded) {
    return null;
  }

  return { uid: decoded.uid, roles: decoded.roles, username: decoded.username };
}