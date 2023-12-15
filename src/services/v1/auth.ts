import jwt from 'jsonwebtoken';
import { env } from '../../config';
import { TUserRoles } from '../../core/IUser';

interface ITokenPayload {
  username: string,
  roles: TUserRoles[],
  uid: string
}

export function signTokens(payload: ITokenPayload): { accessToken: string, refreshToken: string } {
  return {
    accessToken: jwt.sign(payload, env.JWT_SECRET_ACCESS, { expiresIn: '6h' }),
    refreshToken: jwt.sign(payload, env.JWT_SECRET_REFRESH, { expiresIn: '30d' })
  };
}

export function verify(token: string, method: 'access' | 'refresh'): boolean {
  try {
    jwt.verify(token, method === 'access' ? env.JWT_SECRET_ACCESS : env.JWT_SECRET_REFRESH);
    return true;
  } catch (e) {
    return false;
  }
}

export function decode(token: string): ITokenPayload | null {
  const decoded = jwt.decode(token) as ITokenPayload | null;

  if (!decoded) {
    return null;
  }

  return { uid: decoded.uid, roles: decoded.roles, username: decoded.username };
} 