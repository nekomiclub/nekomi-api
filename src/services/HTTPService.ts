import Logger from './LoggerService';
import axios from 'axios';
import conf, { ProductionMode } from '~/config';
import express from 'express';
import { HandleRequest, NekoError } from './ExceptionService';
import { IncomingHttpHeaders } from 'http';



/** Express endpoint that accept callback as a prop */
export const HTTPEndpoint = (callback: (req: express.Request, res: express.Response) => Promise<express.Response>) => {
  return async (req: express.Request, res: express.Response) => {
    return await HandleRequest(req, res, async () => {
      return await callback(req, res);
    });
  };
};



/** Get request IP from HTTP headers */
export function getRequestIP(headers: IncomingHttpHeaders): string {
  return (
    headers['cf-connecting-ip'] ?? headers['CF-Connecting-IP']
    ?? headers['x-forwarded-for'] ?? headers['X-Forwarded-For']
    ?? '0.0.0.0'
  ) as string;
}



export function traceRequest() {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const IP = getRequestIP(req.headers);

    Logger.http(`[Request/${IP}]: ${req.method} ${req.url}`);

    return next();
  };
}



/** 
 * Get current session
 * 
 * @throws E401 if session cookie is missing
 */
export function getSessionToken(req: express.Request): string {
  const token = req.cookies[conf.vars.SESSION_COOKIE_NAME] as string | undefined;
  if (!token) throw new NekoError('auth:token_invalid');

  return token;
}



/** 
 * Set session cookie in response
 */
export function setSessionCookie(token: string, res: express.Response) {
  return res.cookie(conf.vars.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: conf.vars.SESSION_TOKEN_LIFETIME_MS,
    secure: ProductionMode,
    domain: ProductionMode ? '.nekomi.club' : undefined
  });
}



/** 
 * Remove session cookie from response
 */
export function removeSessionCookie(res: express.Response) {
  return res.clearCookie(conf.vars.SESSION_COOKIE_NAME);
}




/** Axios instance */
export const $http = axios.create({
  timeout: 10000
});