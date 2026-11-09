import { config as dotenvCfg } from 'dotenv';

// Configure .env
dotenvCfg({ quiet: true });

import firebaseAdmin from 'firebase-admin';
import fs from 'fs';
import ms from 'ms';

import env from '~/utils/env.js';

import { getUTC } from './utils/utils.js';



export const isTesting = Boolean(env('VITEST'));
export const isProduction = env('ENV') === 'deploy';
export const isDevelopment = !isProduction || !isTesting || env('ENV') === 'local';



const variables = {
  INTERNAL_ID: 'nekomiclub',

  USERNAME_UPDATE_TIMEOUT: ms('7days'),

  SESSION_LIFETIME_MS: ms('31day'),
  SESSION_LIMITATION_TIMEOUT_MS: ms('1day'),
  SESSION_REFRESH_BY_MS: ms('7day'),
  SESSION_COOKIE_NAME: 'nekomi-auth',
  SESSION_COOKIE_DOMAIN: 'nekomi.club',
  SESSION_COOKIE_MAX_AGE_MS: ms('12week'),

  // Default CDN URLs
  default_avatar_url: 'https://cdn.nekomi.club/~default/user-avatar.webp',
  default_user_cover_url: 'https://cdn.nekomi.club/~default/user-cover.webp',
  default_team_cover_url: 'https://cdn.nekomi.club/~default/team-cover.webp',
  default_anime_poster_url: 'https://cdn.nekomi.club/~default/anime-poster.webp',

  // Third-parties APIs URLs
  nekomi_nextjs_url: env('NEKOMI_NEXTJS_URL'),
  nekomi_uploads_service_url: env('NEKOMI_UPLOAD_SERVICE_URL'),
  hikka_client_url: 'https://hikka.io',
  myanimelist_api_url: `https://api.myanimelist.net`,
  hikka_api_url: 'https://api.hikka.io',
  ashdi_api_url: 'https://base.ashdi.vip/api',
  moonanime_api_url: 'https://api.moonanime.art/api',
  imdb_url_api: 'https://api.imdbapi.dev',
  jikan_api_url: 'https://api.jikan.moe',
  idsmoe_api_url: 'https://api.ids.moe',
  shikimori_api_url: 'https://shikimori.one/api',

  // Workspace volumes
  volumes: {
    logs: env('DOCKER') ? '/logs' : './logs',
    cache: env('DOCKER') ? '/.cache' : './.cache',
    firebase: env('DOCKER') ? '/firebase.json' : './firebase.json'
  }
};



// Initialize firebase if creds are available
if (fs.existsSync(variables.volumes.firebase)) firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(variables.volumes.firebase) });



const started_mode = isProduction ? 'Production'
  : isDevelopment ? 'Development'
    : isTesting ? 'Testing'
      : 'undefined';



const conf = {
  mongodb_uri: `mongodb+srv://${env('DATABASE_USR')}:${env('DATABASE_PWD')}@${env('DATABASE_HOST')}/${env('DATABASE_NAME')}`,
  started_at: getUTC().ISO,
  started_mode,

  variables,
};

export default conf;