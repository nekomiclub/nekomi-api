import axios from 'axios';
import { singCSRFToken } from '../services/TokenService';
import { config } from '../config';

/** Axios instance. By default set X-CSRF-Token */
export const $http = axios.create({
  timeout: 30000
});

$http.interceptors.request.use(async cfg => {
  cfg.headers[config.vars.csrfHeader] = singCSRFToken();

  return cfg;
});