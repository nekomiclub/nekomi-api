import axios from 'axios';
import express from 'express';
import http from 'http';
import https from 'https';
import { HandleRequest } from './ErrorService';

import { config } from '~/config';
import { signCSRFToken } from './TokenService';



/** Express endpoint that accept callback as a prop */
export const HTTPEndpoint = (callback: (req: express.Request, res: express.Response) => Promise<any>) => {
  return async (req: express.Request, res: express.Response) => await HandleRequest(req, res, callback);
};

/** Axios instance. By default set X-CSRF-Token */
export const $http = axios.create({
  timeout: 10000
});

$http.interceptors.request.use(async cfg => {
  cfg.headers[config.vars.csrfHeader] = signCSRFToken();

  return cfg;
});

/** Axios upload instance with extended timeout and forced keepAlive. Only for file uploading */
export const $upload = axios.create({
  timeout: 420000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

$upload.interceptors.request.use(async cfg => {
  cfg.headers[config.vars.csrfHeader] = signCSRFToken();

  return cfg;
});