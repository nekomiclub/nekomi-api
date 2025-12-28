import Logger from '~/service/LoggerService';
import axios from 'axios';
import conf, { ProductionMode } from '~/config';
import express from 'express';
import { HandleRequestError, NekoError } from '~/service/ExceptionService';
import { IncomingHttpHeaders } from 'http';



/** 
 * Express endpoint handler with build-in error handling
 * Function cannot be async, unlike a callback 
 * 
 * Callback should return response object
 */
export const HandleRequest = (callback: (req: express.Request, res: express.Response) => Promise<express.Response>) => {
  return async (req: express.Request, res: express.Response) => await HandleRequestError(req, res, callback);
};



/**
 * Express middleware handler with built-in error handling
 * Function cannot be async, unlike a callback 
 */
export function HandleMiddleware(callback: (req: express.Request, res: express.Response) => any) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Proceed to next middleware if request succeeded, otherwise do not
    if (await HandleRequestError(req, res, callback)) return next();
  };
}



/** 
 * Get request IP from HTTP headers
 */
export function getRequestIP(headers: IncomingHttpHeaders): string {
  return (
    headers['cf-connecting-ip'] ?? headers['CF-Connecting-IP']
    ?? headers['x-forwarded-for'] ?? headers['X-Forwarded-For']
    ?? '0.0.0.0'
  ) as string;
}



/**
 * Trace HTTP requests middleware
 */
export function traceRequest() {
  return HandleMiddleware(async (req) => {
    const ip = getRequestIP(req.headers);

    Logger.http(`[Request/${ip}]: ${req.method} ${req.url}`);
  });
}



/** 
 * Get current session
 * 
 * @throws auth:token_invalid if session cookie is missing
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
    maxAge: conf.vars.SESSION_COOKIE_AGE_MS,
    secure: ProductionMode,
    domain: ProductionMode ? conf.vars.SESSION_COOKIE_DOMAIN : undefined,
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