import firebaseAdmin from 'firebase-admin';
import fs from 'fs';
import ms from 'ms';
import path from 'path';
import { createNanoId } from './utils/create-id';
import { config as dotenvCfg } from 'dotenv';
import { execSync } from 'child_process';
import { getUTC } from './utils/utils';



export const ProductionMode = process.env['ENV'] === 'production';
export const TestMode = Boolean(process.env.VITEST);
export const DevelopmentMode = !ProductionMode || !TestMode || process.env['ENV'] === 'development';



// Configure .env
dotenvCfg({ quiet: true });

// Initialize firebase
if (!TestMode) firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(`./firebase.json`) });



const env = {
  PORT: Number(process.env['PORT']),
  HOST: String(process.env['HOST']),

  DATABASE_HOST: String(process.env['DATABASE_HOST']),
  DATABASE_NAME: String(process.env['DATABASE_NAME']),
  DATABASE_USR: String(process.env['DATABASE_USR']),
  DATABASE_PWD: String(process.env['DATABASE_PWD']),

  CSRF_Token: String(process.env['CSRF_Token']),
  MALClientID: String(process.env['MAL-Client-ID']),
  ASHDI_API_KEY: String(process.env['ASHDI_API_KEY']),
  IDS_MOE_KEY: String(process.env['IDS_MOE_KEY']),
  USER_SESSION_SK: String(process.env['USER_SESSION_SK']),

  ISDEV: process.env['ISDEV'] == 'true',
  ISDOCKER: process.env['ISDOCKER'] == 'true',
  ENV: String(process.env['ENV']) as 'development' | 'production',

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

if (!env.ISDOCKER) {
  try {
    const commit = execSync(`git rev-parse --short HEAD`).toString().replace('\n', '');

    fs.writeFileSync(commitFilePath, commit, 'utf-8');

    console.info(`[System]: Git commit retrieved: ${commit}`);
  } catch (e) {
    console.error(`[System]: Cannot retrieve git commit`, e);
  }
}

const commit = fs.existsSync(commitFilePath) ? fs.readFileSync(commitFilePath, 'utf-8') : `NO_COMMIT_${createNanoId()}`;


const URL = {
  proxy: env.PROXY_URL,
  nekomi_site: env.NEKOMI_NEXTJS_URL,
  nekomi_ws: env.NEKOMI_WEBSOCKET_URL,
  nekomi_media: env.NEKOMI_MEDIA_URL,
  nekomi_api: env.NEKOMI_API_URL,
  nekomi_bot: env.NEKOMI_BOT_URL,
  nekomi_upload_service: env.NEKOMI_UPLOADS_URL,
  fullkekw_authority: env.FULLKEKW_AUTHORITY_URL,
  fullkekw_userapi: env.FULLKEKW_USERAPI_URL,
  fullkekw_account: env.FULLKEKW_USERAPI_URL,

  hikka: 'https://hikka.io',
  MALAPI: `https://api.myanimelist.net`,
  hikkaAPI: 'https://api.hikka.io',
  ashdiAPI: 'https://base.ashdi.vip',
  imdbAPI: 'https://api.imdbapi.dev',
  jikanAPI: 'https://api.jikan.moe',
  idsmoeAPI: 'https://api.ids.moe',
  shikimoriAPi: 'https://shikimori.one/api',
};

const domains = {
  NEKOMI_DOMAIN: `nekomi.club`,
  NEKOMI_WEBSOCKET_DOMAIN: `websocket.nekomi.club`,
  NEKOMI_AUTH_DOMAIN: `auth.nekomi.club`,
  NEKOMI_BOT_DOMAIN: `bot.nekomi.club`,
  NEKOMI_MEDIA_DOMAIN: `media.nekomi.club`,
  NEKOMI_API_DOMAIN: `api.nekomi.club`,
  NEKOMI_ADMIN_DOMAIN: `admin.nekomi.club`,
  FULLKEKW_USERAPI_DOMAIN: `usapi.nekomi.club`,
  FULLKEKW_AUTHORITY_DOMAIN: `authority.nekomi.club`,
  FULLKEKW_ACCOUNT_DOMAIN: `account.nekomi.club`,
};

const vars = {
  INTERNAL_ID: 'nekomiclub',

  /** Default avatar */
  defaultAvatar: 'https://media.nekomi.club/0849e678-43ee-4f72-ae5a-bb9ff9d86c89',

  /** Default banner */
  defaultCover: 'https://media.nekomi.club/efe3322f-69db-4084-b21b-5e139978292c',

  /** Default anime poster */
  defaultPoster: 'https://media.nekomi.club/cd0c5c50-8e72-4c13-a40d-01ef3d43f918',

  USERNAME_UPDATE_TIMEOUT: ms('7days'),
  CSRF_TOKEN_LIFETIME_MS: ms('1min'),
  SESSION_TOKEN_LIFETIME_MS: ms('15min'),
  SESSION_LIFETIME_MS: ms('31day'),
  SESSION_LIMITATION_TIMEOUT_MS: ms('1day'),
  SESSION_REFRESH_BY_MS: ms('7day'),

  SESSION_COOKIE_NAME: 'SEC_31N',
  SESSION_COOKIE_DOMAIN: `*.${domains.NEKOMI_DOMAIN}`,
  SESSION_COOKIE_AGE_MS: ms('12week'),
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
  startedMode: `${ProductionMode ? 'Production' : DevelopmentMode ? 'Development' : 'UNKNOWN'}`,
  URL,
  env,
  vars,
  domains,

  rickrollEndpoints
};

export default conf;