import { config as dotenvCfg } from 'dotenv';

// Configure .env
dotenvCfg({ quiet: true });

import firebaseAdmin from 'firebase-admin';
import ms from 'ms';
import parseEnv from './utils/parse-env';
import { IHomeFeedHero } from './interfaces/types';
import { asAnimeId } from './interfaces/BrandedIds';
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
  ashdiAPI: env.ASHDI_API_URL,
  moonanimeAPI: 'https://api.moonanime.art/api',
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

  SESSION_COOKIE_NAME: 'nekomi-auth',
  SESSION_COOKIE_DOMAIN: domains.NEKOMI_DOMAIN,
  SESSION_COOKIE_MAX_AGE_MS: ms('12week'),

  volumes: {
    logs: env.DOCKER ? '/logs' : './logs',
    cache: env.DOCKER ? '/.cache' : './.cache'
  }
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
        id: asAnimeId('2bb03ffc-2584-4c1c-b098-971ad0f90fef'),
        slug: 'hell-s-paradise-season-2',
        title: '',
        synopsys: '',
        poster: vars.defaultPoster,
        cover: 'https://cdn.nekomi.club/feed-cover-1.webp',
        video: 'https://cdn.nekomi.club/feed-video-1.mp4'
      },
      {
        id: asAnimeId('fbc8a9ef-a079-4f40-b7d6-7ed5cf1e25ad'),
        slug: 'frieren-beyond-journey-s-end-season-2',
        title: '',
        synopsys: '',
        poster: vars.defaultPoster,
        cover: 'https://cdn.nekomi.club/feed-cover-2.webp',
        video: 'https://cdn.nekomi.club/feed-video-2.mp4'
      },
      {
        id: asAnimeId('b4c8177f-f654-4fba-a0a0-232cf3a3108d'),
        slug: 'jujutsu-kaisen-the-culling-game-part-1',
        title: '',
        synopsys: '',
        poster: vars.defaultPoster,
        cover: 'https://cdn.nekomi.club/feed-cover-3.webp',
        video: 'https://cdn.nekomi.club/feed-video-3.mp4'
      },
    ] : [
      // Development

      {
        id: asAnimeId('uKiM7NOm'),
        slug: 'frieren-beyond-journey-s-end',
        title: '',
        synopsys: '',
        poster: vars.defaultPoster,
        cover: 'https://cdn.nekomi.club/dandadan.webp',
        video: 'https://cdn.nekomi.club/jjk2_2k.mp4'
      },
      {
        id: asAnimeId('2iEasiqg'),
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

      asAnimeId('ed1a43ac-e686-42e6-8919-a2e3bdb2a8b5'),
      asAnimeId('677ba66f-c83f-41bb-95af-c97b7c8c5605'),
      asAnimeId('42ef1aae-1fb7-4394-a88a-8cace01d9078'),
      asAnimeId('28471ffe-a461-4bfd-97d7-8a1346bd4ce8'),
      asAnimeId('bf341930-6a90-4c78-ab72-9f8093f0b519'),
      asAnimeId('03f293af-8d50-4bec-80e6-7ce8849e5760'),
      asAnimeId('04331571-34b3-4feb-aa09-7544b1962c7a'),
      asAnimeId('e747c1fb-2144-44bb-8d17-10aaf7e65d37'),
    ] : [
      // Development

      asAnimeId('uKiM7NOm'),
      asAnimeId('2iEasiqg'),
      asAnimeId('voGf1ADS'),
    ]) satisfies string[]
  }
};



const conf = {
  mongodbUrl: `mongodb+srv://${env.DATABASE_USR}:${env.DATABASE_PWD}@${env.DATABASE_HOST}/${env.DATABASE_NAME}`,
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