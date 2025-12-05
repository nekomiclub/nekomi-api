import express from 'express';
import log from './LoggerService';
import { HandleRequest } from './ExceptionService';
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

    log.http(`[Request/${IP}]: ${req.method} ${req.url}`);

    return next();
  };
}