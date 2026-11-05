import { config as dotenvCfg } from 'dotenv';

// Configure .env
dotenvCfg({ quiet: true });

import firebaseAdmin from 'firebase-admin';
import fs from 'fs';
import ms from 'ms';
import parseEnv from './utils/parse-env.js';
import { asCDNString } from './interfaces/BrandedIds.js';
import { getUTC } from './utils/utils.js';



const env = parseEnv();

export const ProductionMode = env.ENV === 'deploy';
export const TestMode = Boolean(env.VITEST);
export const DevelopmentMode = !ProductionMode || !TestMode || env.ENV === 'local';



const URL = {
  nekomiSite: env.NEKOMI_NEXTJS_URL,
  nekomiApi: env.NEKOMI_API_URL,
  nekomiUploadService: env.NEKOMI_UPLOAD_SERVICE_URL,

  hikka: 'https://hikka.io',
  MALAPI: `https://api.myanimelist.net`,
  hikkaAPI: 'https://api.hikka.io',
  ashdiAPI: env.ASHDI_API_URL,
  moonanimeAPI: 'https://api.moonanime.art/api',
  imdbAPI: 'https://api.imdbapi.dev',
  jikanAPI: 'https://api.jikan.moe',
  idsmoeAPI: 'https://api.ids.moe',
  shikimoriAPi: 'https://shikimori.one/api',
};

const vars = {
  INTERNAL_ID: 'nekomiclub',

  /** Default avatar @deprecated */
  defaultAvatar: asCDNString('https://media.nekomi.club/0849e678-43ee-4f72-ae5a-bb9ff9d86c89'),

  /** Default banner @deprecated */
  defaultCover: asCDNString('https://media.nekomi.club/efe3322f-69db-4084-b21b-5e139978292c'),

  /** Default anime poster @deprecated */
  defaultPoster: asCDNString('https://media.nekomi.club/cd0c5c50-8e72-4c13-a40d-01ef3d43f918'),

  USERNAME_UPDATE_TIMEOUT: ms('7days'),
  SESSION_LIFETIME_MS: ms('31day'),
  SESSION_LIMITATION_TIMEOUT_MS: ms('1day'),
  SESSION_REFRESH_BY_MS: ms('7day'),

  SESSION_COOKIE_NAME: 'nekomi-auth',
  SESSION_COOKIE_DOMAIN: 'nekomi.club',
  SESSION_COOKIE_MAX_AGE_MS: ms('12week'),

  volumes: {
    logs: env.DOCKER ? '/logs' : './logs',
    cache: env.DOCKER ? '/.cache' : './.cache',
    firebase: env.DOCKER ? '/firebase.json' : './firebase.json'
  }
};



// Initialize firebase
if (fs.existsSync(vars.volumes.firebase)) firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(vars.volumes.firebase) });



const conf = {
  mongodb_uri: `mongodb+srv://${env.DATABASE_USR}:${env.DATABASE_PWD}@${env.DATABASE_HOST}/${env.DATABASE_NAME}`,
  started_at: getUTC().ISO,
  started_mode: `${ProductionMode ? 'Production' : DevelopmentMode ? 'Development' : 'UNKNOWN'}`,

  URL,
  env,
  vars,
};

export default conf;