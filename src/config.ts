import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { config as dotenvCfg } from 'dotenv';

import createId from './utils/create-id';
import { execSync } from 'child_process';
import { getUTC } from './utils/utils';



// Preflight
chalk.level = 1;
dotenvCfg();



export const DevelopmentMode = process.argv.includes('devMode');
export const ProductionMode = process.argv.includes('prodMode');
export const TestMode = process.argv.includes('testMode');

const env = {
  PORT: Number(process.env['PORT']),
  HOST: String(process.env['HOST']),

  DATABASE_HOST: String(process.env['DATABASE_HOST']),
  DATABASE_NAME: String(process.env['DATABASE_NAME']),
  DATABASE_USR: String(process.env['DATABASE_USR']),
  DATABASE_PWD: String(process.env['DATABASE_PWD']),

  CSRF: String(process.env['CSRF-Token']),
  MALClientID: String(process.env['MAL-Client-ID']),
  ASHDI_API_KEY: String(process.env['ASHDI_API_KEY']),

  ISDEV: process.env['ISDEV'] == 'true',
  ISDOCKER: process.env['ISDOCKER'] == 'true',

  // DOMAINS & MICROSERVICE API ENDPOINTS (29.06.2025)
  PROXY_DOMAIN: String(process.env['PROXY_DOMAIN']),
  NEKOMI_DOMAIN: String(process.env['NEKOMI_DOMAIN']),
  NEKOMI_WEBSOCKET_DOMAIN: String(process.env['NEKOMI_WEBSOCKET_DOMAIN']),
  NEKOMI_AUTH_DOMAIN: String(process.env['NEKOMI_AUTH_DOMAIN']),
  NEKOMI_BOT_DOMAIN: String(process.env['NEKOMI_BOT_DOMAIN']),
  NEKOMI_MEDIA_DOMAIN: String(process.env['NEKOMI_MEDIA_DOMAIN']),
  NEKOMI_API_DOMAIN: String(process.env['NEKOMI_API_DOMAIN']),
  NEKOMI_ADMIN_DOMAIN: String(process.env['NEKOMI_ADMIN_DOMAIN']),
  FULLKEKW_USERAPI_DOMAIN: String(process.env['FULLKEKW_USERAPI_DOMAIN']),
  FULLKEKW_AUTHORITY_DOMAIN: String(process.env['FULLKEKW_AUTHORITY_DOMAIN']),
  FULLKEKW_ACCOUNT_DOMAIN: String(process.env['FULLKEKW_ACCOUNT_DOMAIN']),

  NEKOMI_API_URL: String(process.env['NEKOMI_API_URL']),
  PROXY_URL: String(process.env['PROXY_URL']),
  TELEGRAM_BOT_URL: String(process.env['TELEGRAM_BOT_URL']),
  NEKOMI_NEXTJS_URL: String(process.env['NEKOMI_NEXTJS_URL']),
  NEKOMI_WEBSOCKET_URL: String(process.env['NEKOMI_WEBSOCKET_URL']),
  NEKOMI_MEDIA_URL: String(process.env['NEKOMI_MEDIA_URL']),
  NEKOMI_BOT_URL: String(process.env['NEKOMI_BOT_URL']),
  NEKOMI_UPLOADS_URL: String(process.env['NEKOMI_UPLOADS_URL']),
  FULLKEKW_AUTHORITY_URL: String(process.env['FULLKEKW_AUTHORITY_URL']),
  FULLKEKW_USERAPI_URL: String(process.env['FULLKEKW_USERAPI_URL']),
  FULLKEKW_ACCOUNT_URL: String(process.env['FULLKEKW_ACCOUNT_URL']),
};

const logsDir = env.ISDOCKER ? '/logs' : `${path.resolve()}/logs`;



// Retrieve git commit
const commitFilePath = `${logsDir}/git-commit.txt`;

if (!env.ISDOCKER && !TestMode) {
  try {
    const commit = execSync(`git rev-parse --short HEAD`).toString().replace('\n', '');

    fs.writeFileSync(commitFilePath, commit, 'utf-8');

    console.info(`[System]: Git commit retrieved: ${commit}`);
  } catch (e) {
    console.error(`[System]: Cannot retrieve git commit`, e);
  }
}

const commit = fs.existsSync(commitFilePath) ? fs.readFileSync(commitFilePath, 'utf-8') : `NO_COMMIT_${createId()}`;


const URL = {
  proxy: env.PROXY_URL,
  nekomi_site: env.NEKOMI_NEXTJS_URL,
  nekomi_ws: env.NEKOMI_WEBSOCKET_URL,
  nekomi_media: env.NEKOMI_MEDIA_URL,
  nekomi_api: env.NEKOMI_API_URL,
  nekomi_bot: env.NEKOMI_BOT_URL,
  nekomi_uploads: env.NEKOMI_UPLOADS_URL,
  fullkekw_authority: env.FULLKEKW_AUTHORITY_URL,
  fullkekw_userapi: env.FULLKEKW_USERAPI_URL,
  fullkekw_account: env.FULLKEKW_USERAPI_URL,

  hikka: 'https://hikka.io',
  MALAPI: `https://api.myanimelist.net`,
  hikkaAPI: 'https://api.hikka.io',
  ashdiAPI: 'https://base.ashdi.vip',
  imdbAPI: 'https://api.imdbapi.dev',
  jikanAPI: 'https://api.jikan.moe',
};

const vars = {
  /** Use it ONLY FOR INTERNAL CHANGE PURPOSES, or you will be fired :) */
  INTERNAL_ROOT_USER_ID: 'nekomiclub',

  /** Nekomi cookie with fullkekw usapi session */
  sessionCookie: 'SEC_31N',

  /** Nekomi cookie expiration offset */
  sessionCookieExpireOffset: 2592000000,

  /** Mock data header */
  mockHeader: 'X-MockData',

  /** CSRF Token header name */
  csrfHeader: 'X-CSRF-Token',

  /** CSRF token expiration */
  CSRF_EXPIRE: 180000,

  /** Default avatar */
  defaultAvatar: 'https://media.nekomi.club/0849e678-43ee-4f72-ae5a-bb9ff9d86c89',

  /** Default banner */
  defaultBanner: 'https://media.nekomi.club/efe3322f-69db-4084-b21b-5e139978292c',

  /** Default anime poster */
  defaultPoster: 'https://media.nekomi.club/cd0c5c50-8e72-4c13-a40d-01ef3d43f918',
};

/** Funny thing to rickroll some endpoints */
const rickrollEndpoints: RegExp[] = [
  /\/\.env(.+)?/gi,
  /\/cgi-bin(.+)?/gi,
  /\/login(.+)?/gi,
  /\/dns-query(.+)?/gi,
  /\/query(.+)?/gi,
  /\/hello.world(.+)?/gi,
  /\/geoserver(.+)?/gi,
  /\/\.git(.+)?/gi,
  /\/\phpMyAdmin(.+)?/gi,
  /\/\resolve(.+)?/gi,
];



const conf = {
  mongodbUrl: `mongodb://${env.DATABASE_USR}:${env.DATABASE_PWD}@${env.DATABASE_HOST}/${env.DATABASE_NAME}`,
  commit,
  logsDir,
  startedAt: `${getUTC().fulldate} ${getUTC().time}.${getUTC().str.ms}`,
  startedMode: `${ProductionMode ? 'Production' : DevelopmentMode ? 'Development' : 'UNKNOWN'}${TestMode ? ' (Testing)' : ''}`,
  URL,
  env,
  vars,

  rickrollEndpoints
};

export default conf;