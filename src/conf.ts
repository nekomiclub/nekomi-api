import { config as dotenvCfg } from 'dotenv';

// Configure .env
dotenvCfg({ quiet: true });

import firebaseAdmin from 'firebase-admin';
import ms from 'ms';
import parseEnv from './utils/parse-env';
import { IHomeFeedHero } from './interfaces/types';
import { getUTC } from './utils/utils';



const env = parseEnv();

export const ProductionMode = env.ENV === 'deploy';
export const TestMode = Boolean(env.VITEST);
export const DevelopmentMode = !ProductionMode || !TestMode || env.ENV === 'local';



// Initialize firebase
firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(`./firebase.json`) });



const URL = {
  nekomiSite: env.NEKOMI_NEXTJS_URL,
  nekomiApi: env.NEKOMI_API_URL,
  nekomiUploadService: env.NEKOMI_UPLOAD_SERVICE_URL,

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
  NEKOMI_AUTH_DOMAIN: `auth.nekomi.club`,
  NEKOMI_BOT_DOMAIN: `bot.nekomi.club`,
  NEKOMI_API_DOMAIN: `api.nekomi.club`,
  NEKOMI_ADMIN_DOMAIN: `admin.nekomi.club`,
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
  SESSION_LIFETIME_MS: ms('31day'),
  SESSION_LIMITATION_TIMEOUT_MS: ms('1day'),
  SESSION_REFRESH_BY_MS: ms('7day'),

  SESSION_COOKIE_NAME: 'SEC_31N',
  SESSION_COOKIE_DOMAIN: `*.${domains.NEKOMI_DOMAIN}`,
  SESSION_COOKIE_MAX_AGE_MS: ms('12week'),
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



const StaticData = {
  HomeFeed: {
    hero: (ProductionMode ? [
      // ! Production

      {
        id: 'uKiM7NOm',
        slug: 'frieren-beyond-journey-s-end',
        title: '',
        synopsys: '',
        poster: vars.defaultPoster,
        cover: 'https://cdn.nekomi.club/dandadan.webp',
        video: 'https://cdn.nekomi.club/jjk2_2k.mp4'
      },
    ] : [
      // Development

      {
        id: 'uKiM7NOm',
        slug: 'frieren-beyond-journey-s-end',
        title: '',
        synopsys: '',
        poster: vars.defaultPoster,
        cover: 'https://cdn.nekomi.club/dandadan.webp',
        video: 'https://cdn.nekomi.club/jjk2_2k.mp4'
      },
      {
        id: '2iEasiqg',
        slug: 'chainsaw-man-the-movie-reze-arc',
        title: '',
        synopsys: '',
        poster: vars.defaultPoster,
        cover: 'https://cdn.nekomi.club/dandadan.webp',
        video: 'https://cdn.nekomi.club/jjk2_2k.mp4'
      }
    ]) satisfies IHomeFeedHero[],

    hot: (ProductionMode ? [
      // Production

      'uKiM7NOm',
      '2iEasiqg',
      'voGf1ADS',
    ] : [
      // Development

      'uKiM7NOm',
      '2iEasiqg',
      'voGf1ADS',
    ]) satisfies string[]
  }
};



const conf = {
  mongodbUrl: `mongodb://${env.DATABASE_USR}:${env.DATABASE_PWD}@${env.DATABASE_HOST}/${env.DATABASE_NAME}`,
  startedAt: `${getUTC().fulldate} ${getUTC().time}.${getUTC().str.ms}`,
  startedMode: `${ProductionMode ? 'Production' : DevelopmentMode ? 'Development' : 'UNKNOWN'}`,
  URL,
  env,
  vars,
  domains,
  StaticData,

  rickrollEndpoints
};

export default conf;