import axios from 'axios';
import express from 'express';
import http from 'http';
import https from 'https';
import { ERR_MIDDLEWARE_REQUIRED, HandleRequest } from './ErrorService';

import { TMiddlewareName } from './MiddlewareService';
import { config } from '~/config';
import { signCSRFToken } from './TokenService';



interface HTTPEndpointProps {
  /** Required middlewares */
  requireMiddlewares?: TMiddlewareName[]
}



/** Express endpoint that accept callback as a prop */
export const HTTPEndpoint = (callback: (req: express.Request, res: express.Response) => Promise<any>, props?: HTTPEndpointProps) => {
  return async (req: express.Request, res: express.Response) => {
    return await HandleRequest(req, res, async () => {
      if (props?.requireMiddlewares?.includes('checkAccess') && !req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
      if (props?.requireMiddlewares?.includes('checkCSRF') && !req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

      return await callback(req, res);
    });
  };
};



/** Axios instance. By default set X-CSRF-Token */
export const $http = axios.create({
  timeout: 10000
});

/** Axios upload instance with extended timeout and forced keepAlive. Only for file uploading */
export const $upload = axios.create({
  timeout: 420000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

/** MyAnimeList axios instance. Will set X-MAL-CLIENT-ID header */
export const $mal = axios.create({
  timeout: 10000,
  baseURL: config.URL.MyanimelistAPI
});



$http.interceptors.request.use(async cfg => {
  cfg.headers[config.vars.csrfHeader] = signCSRFToken();

  return cfg;
});

$upload.interceptors.request.use(async cfg => {
  cfg.headers[config.vars.csrfHeader] = signCSRFToken();

  return cfg;
});

$mal.interceptors.request.use(async cfg => {
  cfg.headers['X-MAL-CLIENT-ID'] = config.env.MALClientID;

  return cfg;
});