import axios, { AxiosResponse } from 'axios';
import express from 'express';
import { ERR_MIDDLEWARE_REQUIRED, HandleRequest } from './ErrorService';
import { IncomingHttpHeaders } from 'http';

import TokenService from './TokenService';
import { ApiOrigins, config } from '~/config';
import { Logger } from './LoggerService';
import { TMiddlewareName } from './MiddlewareService';
import { getUTC } from '~/utils/utils';



interface HTTPEndpointProps {
  /** Required middlewares */
  requireMiddlewares?: TMiddlewareName[]
}



/** Express endpoint that accept callback as a prop */
export const HTTPEndpoint = (callback: (req: express.Request, res: express.Response) => Promise<express.Response>, props?: HTTPEndpointProps) => {
  return async (req: express.Request, res: express.Response) => {
    return await HandleRequest(req, res, async () => {
      if (props?.requireMiddlewares?.includes('checkAccess') && !req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
      if (props?.requireMiddlewares?.includes('checkCSRF') && !req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

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



/** Axios instance. By default set X-CSRF-Token */
export const $http = axios.create({
  timeout: 10000
});

/** Axios upload instance with extended timeout and forced keepAlive. Only for file uploading */
export const $upload = axios.create({
  timeout: 420000
});

/** MyAnimeList axios instance. Will set X-MAL-CLIENT-ID header */
export const $mal = axios.create({
  timeout: 10000,
});



$http.interceptors.request.use(async cfg => {
  cfg['timeStart'] = getUTC().timestamp;
  cfg.headers.set(config.vars.csrfHeader, TokenService.signCSRF());

  return cfg;
});

$http.interceptors.response.use(async cfg => {
  getResponseMetrics(cfg);

  return cfg;
}, async cfg => {
  // Retry ECONNRESET & ECONNABORTED
  if ((cfg.code === 'ECONNRESET' || cfg.code === 'ECONNABORTED') && !cfg.config.__isRetryRequest) {
    cfg.config.headers.set(config.vars.csrfHeader, TokenService.signCSRF());
    cfg.config.__isRetryRequest = true;

    return axios(cfg.config);
  }

  getResponseMetrics(cfg);

  throw cfg;
});



$upload.interceptors.request.use(async cfg => {
  cfg['timeStart'] = getUTC().timestamp;
  cfg.headers.set(config.vars.csrfHeader, TokenService.signCSRF());

  return cfg;
});

$http.interceptors.response.use(async cfg => {
  getResponseMetrics(cfg);

  return cfg;
});



$mal.interceptors.request.use(async cfg => {
  cfg['timeStart'] = getUTC().timestamp;
  cfg.headers.set('X-MAL-CLIENT-ID', config.env.MALClientID);

  return cfg;
});

$mal.interceptors.response.use(async cfg => {
  getResponseMetrics(cfg);

  return cfg;
});



function getResponseMetrics(cfg: AxiosResponse) {
  const timeStart = cfg.config['timeStart'] as number;
  const timeEnd = getUTC().timestamp;
  const url = new URL(cfg.config.url ?? 'http://internal.api');
  const host = `${url.protocol}//${url.host}`;
  const isRetried = Boolean(cfg.config['__isRetryRequest']);

  Logger.trace(`[${ApiOrigins[host] ?? 'API'}]: ${cfg.config.method?.toUpperCase()} ${cfg.config.url?.replace(host, '')} executed within ${timeEnd - timeStart} ms${isRetried ? ' (retried)' : ''}`);
}