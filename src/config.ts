import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { config as dotenvCfg } from 'dotenv';

import { createUUID, getUTC } from './utils/utils';
import { execSync } from 'child_process';



// Preflight
chalk.level = 1;
dotenvCfg();



export const DevelopmentMode = process.argv.includes('devMode');
export const ProductionMode = process.argv.includes('prodMode');
export const TestMode = process.argv.includes('testMode');

const env = {
  PORT_PROMETHEUS: Number(process.env['PORT_PROMETHEUS']),
  PORT: Number(process.env['PORT']),
  HOST: String(process.env['HOST']),

  DATABASE_HOST: String(process.env['DATABASE_HOST']),
  DATABASE_PORT: Number(process.env['DATABASE_PORT']),
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

if (!env.ISDOCKER) {
  try {
    const commit = execSync(`git rev-parse --short HEAD`).toString().replace('\n', '');

    fs.writeFileSync(commitFilePath, commit, 'utf-8');

    console.info(`[System]: Git commit retrieved: ${commit}`);
  } catch (e) {
    console.error(`[System]: Cannot retrieve git commit`, e);
  }
}

const commit = fs.existsSync(commitFilePath) ? fs.readFileSync(commitFilePath, 'utf-8') : `NO_COMMIT_${createUUID()}`;



const DOMAIN = {
  proxy: env.PROXY_DOMAIN,
  nekomi: env.NEKOMI_DOMAIN,
  nekomi_auth: env.NEKOMI_AUTH_DOMAIN,
  nekomi_api: env.NEKOMI_API_DOMAIN,
  nekomi_media: env.NEKOMI_MEDIA_DOMAIN,
  nekomi_bot: env.NEKOMI_BOT_DOMAIN,
  nekomi_websocket: env.NEKOMI_WEBSOCKET_DOMAIN,
  nekomi_admin: env.NEKOMI_ADMIN_DOMAIN,

  fullkekw_authority: env.FULLKEKW_AUTHORITY_DOMAIN,
  fullkekw_userapi: env.FULLKEKW_USERAPI_DOMAIN,
  fullkekw_account: env.FULLKEKW_ACCOUNT_DOMAIN,
};

const STATIC = {
  AnimeFeatured: {
    headliners:
      ProductionMode
        ? [{
          id: '90195ae6-e7c6-4608-8894-05041e06343b', // Gachiakuta
          backgroundURL: 'https://media.nekomi.club/b36bf271-5131-4062-91b3-2ac1fef9cad5',
          videoURL: 'https://media.nekomi.club/gachiakuta-op',
        }, {
          id: '38c54682-108e-481b-9cdc-9e14658c1f75', // The Fragrant Flower Blooms with Dignity
          backgroundURL: 'https://media.nekomi.club/1367cb78-0594-409d-99b3-4a424a4e545f',
          videoURL: 'https://media.nekomi.club/fragrant-flower-op',
        }, {
          id: '96a213e7-b440-474c-8cd4-270ca5dfd150', // Grand Blue Dreaming Season 2
          backgroundURL: 'https://media.nekomi.club/ef7b1eb7-ab89-48ba-85bb-2128490f3d11',
          videoURL: 'https://media.nekomi.club/grand-blue-op',
        }]
        : [{
          id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
          backgroundURL: 'https://media.nekomi.club/b36bf271-5131-4062-91b3-2ac1fef9cad5',
          videoURL: 'https://media.nekomi.club/gachiakuta-op',
        }, {
          id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
          backgroundURL: 'https://media.nekomi.club/1367cb78-0594-409d-99b3-4a424a4e545f',
          videoURL: 'https://media.nekomi.club/fragrant-flower-op',
        }, {
          id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
          backgroundURL: 'https://media.nekomi.club/ef7b1eb7-ab89-48ba-85bb-2128490f3d11',
          videoURL: 'https://media.nekomi.club/grand-blue-op',
        },],


    hot:
      ProductionMode
        ? [
          '4af6ccf4-18e7-465e-96fd-f1c131cead4e',
          '6883f1c2-7820-47b6-ae31-52ac2ec0cd5c',
          '841c3c0b-1d78-4c6a-8d6c-cd91295f70f5',
          'a4e7b293-be4d-4f5d-97be-c1b7cde2c5fe',
        ]
        : [
          '627690b0-f0c1-490d-b50e-c5ace32cd563',
          '2e546c6f-8545-4ea4-b9b9-3533d860d36a',
          'fc6868df-bd76-494e-840f-f7ff3dd67e2d'
        ]
  }
};

const VALIDATION = {
  CreateUser: {
    minNameLength: 6,
    maxNameLength: 32
  },
  PatchTitle: {
    minNameLength: 1,
    maxNameLength: 320,
    maxAltNamesCount: 7,
    maxDescriptionLength: 2200,
    maxDetailsLength: 500,
    minEpisode: 1,
    maxEpisode: 9999,
    maxGenresCount: 10,
    minRating: 1,
    maxRating: 10,
    minYear: 2000,
    maxYear: 2050,
    maxStudiosCount: 5,
    minStudioLength: 3,
    maxStudioLength: 32,
  },


  User: {
    /** In bytes */
    MaximumAvatarSize: 1048576,
    /** In bytes */
    MaximumBannerSize: 2097152,

    MinimumLibNameLength: 3,
    MaximumLibNameLength: 32,
    MaximumIncreaseViewtime: 7200, // 2h
  },

  Anime: {
    minYear: 2007,
    maxYear: getUTC().year + 1,

    maxNameLength: 320,
    maxAltNamesLength: 7,
    maxStudiosLength: 7,
    maxGenresLength: 7,
    maxEpisodesCount: 9999,
    maxDescriptionLength: 2200,
    maxDetailsLength: 500,

    maxScore: 10
  }
};

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

export const ApiOrigins: Partial<Record<string, string>> = {
  [URL.nekomi_bot]: 'NekomiBotAPI',
  [URL.hikkaAPI]: 'HikkaAPI',
  [URL.fullkekw_account]: 'FullkekwUserAPI',
  [URL.fullkekw_authority]: 'FullkekwAuthorityAPI',
  [URL.MALAPI]: 'MyAnimeListAPI',
  [URL.jikanAPI]: 'JikanAPI',
  [URL.ashdiAPI]: 'AshidiAPI',
  [URL.imdbAPI]: 'IMDBAPI',
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

  MyAnimeListSyncCooldown: 432000000, // 5d | 432000000
  AshdiSyncCooldown: 172800000, // 2d | 172800000

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



export const config = {
  mongodbUrl: `mongodb://${env.DATABASE_USR}:${env.DATABASE_PWD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`,
  commit,
  logsDir,
  startedAt: `${getUTC().fulldate} ${getUTC().timeAccurate}`,
  startedMode: `${ProductionMode ? 'Production' : DevelopmentMode ? 'Development' : 'UNKNOWN'}${TestMode ? ' (Testing)' : ''}`,
  URL,
  env,
  vars,

  VALIDATION,
  DOMAIN,
  STATIC,
  rickrollEndpoints
};



//! CHANGE HTTP PORT TO DEFAULT. IN PROD MODE THIS WILL BE MANAGED BY NGINX.
if (DevelopmentMode) {
  env.PORT = 80;
}