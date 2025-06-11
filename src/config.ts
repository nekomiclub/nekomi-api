import chalk from 'chalk';
import { config as dotenvCfg } from 'dotenv';
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
  DATABASE_PORT: Number(process.env['DATABASE_PORT']),
  DATABASE_NAME: String(process.env['DATABASE_NAME']),
  DATABASE_USR: String(process.env['DATABASE_USR']),
  DATABASE_PWD: String(process.env['DATABASE_PWD']),

  CSRF: String(process.env['CSRF-Token']),
  MALClientID: String(process.env['MAL-Client-ID']),

  NEKOMI_DOMAIN: String(process.env['NEKOMI_DOMAIN']),
  NEKOMI_AUTH_DOMAIN: String(process.env['NEKOMI_AUTH_DOMAIN']),
  NEKOMI_BOT_DOMAIN: String(process.env['NEKOMI_BOT_DOMAIN']),
  NEKOMI_MEDIA_DOMAIN: String(process.env['NEKOMI_MEDIA_DOMAIN']),
  NEKOMI_API_DOMAIN: String(process.env['NEKOMI_API_DOMAIN']),
  FULLKEKW_USERAPI_DOMAIN: String(process.env['FULLKEKW_USERAPI_DOMAIN']),
  FULLKEKW_AUTHORITY_DOMAIN: String(process.env['FULLKEKW_AUTHORITY_DOMAIN']),

  NEKOMI_API_URL: String(process.env['NEKOMI_API_URL']),
  NEKOMI_NEXTJS_URL: String(process.env['NEKOMI_NEXTJS_URL']),
  NEKOMI_MEDIA_URL: String(process.env['NEKOMI_MEDIA_URL']),
  NEKOMI_BOT_URL: String(process.env['NEKOMI_BOT_URL']),
  NEKOMI_UPLOADS_URL: String(process.env['NEKOMI_UPLOADS_URL']),
  FULLKEKW_AUTHORITY_URL: String(process.env['FULLKEKW_AUTHORITY_URL']),
  FULLKEKW_USERAPI_URL: String(process.env['FULLKEKW_USERAPI_URL']),
};



const DOMAIN = {
  nekomi: env.NEKOMI_DOMAIN,
  nekomiAuth: env.NEKOMI_AUTH_DOMAIN,
  nekomiApi: env.NEKOMI_API_DOMAIN,
  nekomiMedia: env.NEKOMI_MEDIA_DOMAIN,
  nekomiBot: env.NEKOMI_BOT_DOMAIN,

  fullkekwAuthority: env.FULLKEKW_AUTHORITY_DOMAIN,
  fullkekwUserapi: env.FULLKEKW_USERAPI_DOMAIN,
};

const STATIC = {
  AnimeFeatured: {
    headliners:
      ProductionMode
        ? [{
          id: '3cf9bee6-fbbb-4950-b112-d27da97a8518', // Devil May Cry 2025
          backgroundURL: 'https://media.nekomi.club/0fb3bd81-5deb-4e2c-8a73-be618b26053b',
          videoURL: 'https://media.nekomi.club/b88ed577-a580-41a5-9089-2fb91c67a921'
        }, {
          id: 'f9666d0a-f24b-4d7f-bd47-5723d965f52f', // Lazarus
          backgroundURL: 'https://media.nekomi.club/abfe8c6e-7fee-44a8-aed0-f9d7e38f3f05',
          videoURL: 'https://media.nekomi.club/04b5044e-5f77-43a3-b6b4-b658f401b405'
        }, {
          id: 'f846581c-0c8c-4d73-84aa-76d5ed928453', // The apothecary diaries
          backgroundURL: 'https://media.nekomi.club/0729c26a-52b3-465c-a030-db683df68d09',
          videoURL: 'https://media.nekomi.club/ea9a007c-017f-42c0-a94d-34729884c5d6'
        }]
        : [{
          id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
          backgroundURL: 'https://media.nekomi.club/0729c26a-52b3-465c-a030-db683df68d09',
          videoURL: 'https://media.nekomi.club/ea9a007c-017f-42c0-a94d-34729884c5d6'
        }, {
          id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
          backgroundURL: 'https://media.nekomi.club/0fb3bd81-5deb-4e2c-8a73-be618b26053b',
          videoURL: 'https://media.nekomi.club/b88ed577-a580-41a5-9089-2fb91c67a921'
        }, {
          id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
          backgroundURL: 'https://media.nekomi.club/abfe8c6e-7fee-44a8-aed0-f9d7e38f3f05',
          videoURL: 'https://media.nekomi.club/04b5044e-5f77-43a3-b6b4-b658f401b405'
        },],


    hot:
      ProductionMode
        ? [
          '3cf9bee6-fbbb-4950-b112-d27da97a8518',
          'f9666d0a-f24b-4d7f-bd47-5723d965f52f',
          '6f3ffe87-3f22-4a70-b36b-d13dec3f5c40',
          'f846581c-0c8c-4d73-84aa-76d5ed928453',
          'ee050b75-2a7c-4142-98b0-945c2f3b9726',
          '2eabab44-020e-4a22-bfff-1bf0096abd59',
          '1c47303c-0a41-4dff-9c98-92f9bdc95824',
          'fa1f686b-ab4f-4147-a748-1c797674f00f',
          '42f1042a-a0fc-47d5-b1f1-40556fcdff6f',
          '807fc8e2-b861-49cf-ba3b-7031d549a932',
          'e3938803-9f07-40a8-b881-6362aee03c9f',
          '895389f0-90d8-4b9c-9998-14c1453cae0e',
          '6a720a3d-ad21-4b91-8e59-a7a90109368e',
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
  WatchTogether: {
    textMessageLength: 256
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
  nekomi_site: env.NEKOMI_NEXTJS_URL,
  nekomi_media: env.NEKOMI_MEDIA_URL,
  nekomi_core: env.NEKOMI_API_URL,
  nekomi_bot: env.NEKOMI_BOT_URL,
  nekomi_uploads: env.NEKOMI_UPLOADS_URL,
  fullkekw_authority: env.FULLKEKW_AUTHORITY_URL,
  fullkekw_usapi: env.FULLKEKW_USERAPI_URL,
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

  MyAnimeListSyncTimeout: 432000000, // 5d | 432000000

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
  commit: execSync(`git rev-parse --short HEAD`).toString().replace('\n', ''),
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