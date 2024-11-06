import axios from 'axios';
import http from 'http';
import https from 'https';

import { singCSRFToken } from '../services/TokenService';
import { config } from '../config';

/** Axios instance. By default set X-CSRF-Token */
export const $http = axios.create({
  timeout: 15000
});

$http.interceptors.request.use(async cfg => {
  cfg.headers[config.vars.csrfHeader] = singCSRFToken();

  return cfg;
});

/** Axios upload instance with extended timeout */
export const $upload = axios.create({
  timeout: 420000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

$upload.interceptors.request.use(async cfg => {
  cfg.headers[config.vars.csrfHeader] = singCSRFToken();

  return cfg;
});