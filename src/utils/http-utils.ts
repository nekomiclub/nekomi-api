import Logger from '~/services/LoggerService.js';
import axios from 'axios';
import conf, { isProduction } from '~/conf.js';
import express from 'express';
import z, { ZodType } from 'zod';
import { HandleRequestError, NekoError } from '~/services/ExceptionService.js';
import { IncomingHttpHeaders } from 'http';
import { MiddlewareType } from '~/services/MiddlewareService.js';



interface IHandleRequestProps {
  /** Ensure that request was passed throught middlewares, otherwise throw an error */
  middlewares?: MiddlewareType[]
}



/** 
 * Express endpoint handler with build-in error handling
 * Function cannot be async, unlike a callback 
 * 
 * Callback should return response object
 */
export const HandleRequest = (callback: (req: express.Request, res: express.Response) => Promise<express.Response>, props?: IHandleRequestProps) => {
  return async (req: express.Request, res: express.Response) => {
    await HandleRequestError(req, res, async () => {
      // Ensure that each required middleware has been passed
      props?.middlewares?.forEach(mw => {
        if (!req._nekomi.middlewaresPassed.includes(mw)) throw new NekoError(`sys:middleware_required`, `Required middleware "${mw}" is not passed`);
      });

      await callback(req, res);
    });
  };
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
 * Define internal data
 */
export function traceRequest() {
  return HandleMiddleware(async (req) => {
    const ip = getRequestIP(req.headers);

    // Supress health check logging
    if (req.url.match('/healthcheck')) return;

    req._nekomi = {
      middlewaresPassed: []
    };

    Logger.http(`[Request/${ip}]: ${req.method} ${req.url}`);
  });
}



/** 
 * Get authorization token
 * If user passed throught Middleware.CheckAccess() middleware, will retrieve fresh session token
 * 
 * @throws auth:token_miss if session cookie is missing
 */
export function getAuthorizationToken(req: express.Request): string {
  const token = req._nekomi.sessionToken ?? req.headers['authorization']?.replace('Bearer ', '') ?? req.cookies[conf.variables.SESSION_COOKIE_NAME] as string | undefined;
  if (!token) throw new NekoError('auth:token_miss');

  return token;
}



/** 
 * Get API key
 * 
 * @throws auth:api_key_miss if api key header is missing
 */
export function getAPIKey(req: express.Request): string {
  const token = req.header('x-api-key');
  if (!token) throw new NekoError('auth:api_key_miss');

  return token;
}



/** 
 * Set session cookie in response
 */
export function setSessionCookie(token: string, res: express.Response) {
  return res.cookie(conf.variables.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: conf.variables.SESSION_COOKIE_MAX_AGE_MS,
    secure: isProduction,
    domain: isProduction ? conf.variables.SESSION_COOKIE_DOMAIN : undefined,
    sameSite: 'lax',
  });
}



/** Axios instance */
export const $http = axios.create({
  timeout: 10000
});



/** Base HTTP response schema */
export const BaseResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  code: z.string().nullish(),
  error: z.string().nullish(),
  errors: z.any().array().nullish(),
}).openapi('BaseResponseSchema');

export const ErrorResponseSchema = CreateResponseSchema(z.object({
  date: z.string().date(),
  requestUrl: z.string().url().nullish(),
})).openapi('ErrorResponseSchema');



/** Create http response zod schema */
export function CreateResponseSchema<T extends ZodType>(payload: T) {
  return BaseResponseSchema.extend({
    data: payload
  });
}


/** Send typed response */
export const SendResponse = <T extends ZodType>(payload: z.infer<T>, schema: T) => payload;



export const EndpointMiddlewares = (middlewares: express.RequestHandler[], endpoint: express.RequestHandler) => [...middlewares, endpoint];