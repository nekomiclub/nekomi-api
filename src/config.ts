import { config as dotenvCfg } from 'dotenv';

dotenvCfg();

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

import { ISERVICE_CONFIG } from '../SERVICE_CONFIG';
import { getUTC, preserveIP } from './handlers/handler';



export const DevelopmentMode = process.argv.includes('devMode');
export const ProductionMode = process.argv.includes('prodMode');
export const TestMode = process.argv.includes('testMode');


const SERVICE_CONFIG = JSON.parse(fs.readFileSync(`${path.resolve()}/../SERVICE_CONFIG.json`).toString()) as ISERVICE_CONFIG;
const FULLKEKW_CONFIG = {
  DOMAINS: {
    fullkekw: 'nekomi.club',
    fullkekw_authority: 'authority.nekomi.club',
    fullkekw_usapi: 'usapi.nekomi.club',
  },
  SERVICES: {
    fullkekw_authority: {
      host: '0.0.0.0',
      port: 45010
    },
    fullkekw_usapi: {
      host: '0.0.0.0',
      port: 45660
    },
  }
};

const DOMAIN = {
  nekomi: SERVICE_CONFIG.DOMAINS.nekomi_site,
  nekomi_auth: SERVICE_CONFIG.DOMAINS.nekomi_auth,
  nekomi_core: SERVICE_CONFIG.DOMAINS.nekomi_api,
  nekomi_media: SERVICE_CONFIG.DOMAINS.nekomi_media,
  nekomi_bot: SERVICE_CONFIG.DOMAINS.nekomi_bot,

  fullkekw: FULLKEKW_CONFIG.DOMAINS.fullkekw,
  fullkekw_authority: FULLKEKW_CONFIG.DOMAINS.fullkekw_authority,
  fullkekw_usapi: FULLKEKW_CONFIG.DOMAINS.fullkekw_usapi,
};



/** @deprecated */
export const STATIC = {
  HomeWrapped: {
    featured: ProductionMode ? [{
      id: '1db09f56-4ca8-4f11-9f6d-ca27ab682165',
      backgroundURL: 'https://media.nekomi.club/21df5d21-c78f-4e5b-a101-65ead751310e',
      videoURL: 'https://media.nekomi.club/3c3407d5-7ec7-40b1-a564-1180950c0f08'
    }] : [{
      id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
      backgroundURL: 'https://media.nekomi.club/21df5d21-c78f-4e5b-a101-65ead751310e',
      videoURL: 'https://media.nekomi.club/3c3407d5-7ec7-40b1-a564-1180950c0f08'
    }],


    popular: ProductionMode ? [
      '10132d3e-366a-484b-8caa-be4d97e51f6b',
      '33f283ac-0c22-4266-8ced-96292fe7ce7e',
      '18be952e-40ae-4527-9266-042e3d813012',
      '72d081e4-7783-4e2e-8dc8-b6fcd8926964',
      'b4229fae-5908-4488-874d-57dce31d2ad7',
      '0b342f7c-515a-4f58-b309-2de334f79dc8',
    ] : [
      '627690b0-f0c1-490d-b50e-c5ace32cd563',
      '2e546c6f-8545-4ea4-b9b9-3533d860d36a',
      'fc6868df-bd76-494e-840f-f7ff3dd67e2d'
    ]
  }
};

export const INTERNALS = {
  database: {
    host: SERVICE_CONFIG.DATABASE!.host,
    port: SERVICE_CONFIG.DATABASE!.port,
    creds: ProductionMode ? SERVICE_CONFIG.SERVICES.nekomi_api.DATABASE!.production : SERVICE_CONFIG.SERVICES.nekomi_api.DATABASE!.development
  },
  http_server: {
    host: preserveIP(SERVICE_CONFIG.SERVICES.nekomi_api.host),
    port: SERVICE_CONFIG.SERVICES.nekomi_api.port
  },
  ws_server: {
    host: preserveIP(SERVICE_CONFIG.SERVICES.nekomi_api.host),
    port: SERVICE_CONFIG.SERVICES.nekomi_api.port_ws!
  },
  SERVICE_CONFIG
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
  }
};

const URL = {
  nekomi_site: ProductionMode ? `https://${DOMAIN.nekomi}` : `http://${preserveIP(SERVICE_CONFIG.SERVICES.nekomi_site.host)}:${SERVICE_CONFIG.SERVICES.nekomi_site.port}`,
  nekomi_media: ProductionMode ? `https://${DOMAIN.nekomi_media}` : `http://${preserveIP(SERVICE_CONFIG.SERVICES.nekomi_media.host)}:${SERVICE_CONFIG.SERVICES.nekomi_media.port}`,

  /** In development mode port was changed into 80 */
  nekomi_core: ProductionMode ? `https://${DOMAIN.nekomi_core}` : `http://${preserveIP(SERVICE_CONFIG.SERVICES.nekomi_api.host)}`,

  //* LOCAL
  nekomi_bot: `http://${preserveIP(SERVICE_CONFIG.SERVICES.nekomi_bot.host)}:${SERVICE_CONFIG.SERVICES.nekomi_bot.port}`,
  nekomi_uploads: `http://${preserveIP(SERVICE_CONFIG.SERVICES.nekomi_uploads.host)}:${SERVICE_CONFIG.SERVICES.nekomi_uploads.port}`,



  fullkekw_authority: ProductionMode ? `https://${DOMAIN.fullkekw_authority}` : `http://${preserveIP(FULLKEKW_CONFIG.SERVICES.fullkekw_authority.host)}:${FULLKEKW_CONFIG.SERVICES.fullkekw_authority.port}`,
  fullkekw_usapi: ProductionMode ? `https://${DOMAIN.fullkekw_usapi}` : `http://${preserveIP(FULLKEKW_CONFIG.SERVICES.fullkekw_usapi.host)}:${FULLKEKW_CONFIG.SERVICES.fullkekw_usapi.port}`,
};

const env = {
  CSRF: process.env['CSRF-Token']!
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

  /** Production IP */
  prodIP: '192.168.0.107',

  /** CSRF token expiration */
  CSRF_EXPIRE: 180000,

  /** Default avatar for nekomi creations */
  defaultAvatar: 'https://media.nekomi.club/0849e678-43ee-4f72-ae5a-bb9ff9d86c89',

  /** Default banner for users */
  defaultBanner: 'https://media.nekomi.club/efe3322f-69db-4084-b21b-5e139978292c',

  /** Default poster for nekomi titles */
  defaultPoster: 'https://media.nekomi.club/f55b8f18-6c59-4b1d-ae5e-ed22a918eb91',
};



export const config = {
  mongodbUrl: `mongodb://${INTERNALS.database.creds!.usr}:${INTERNALS.database.creds!.pwd}@${INTERNALS.database.host}:${INTERNALS.database.port}/${INTERNALS.database.creds!.name}`,
  commit: execSync(`git rev-parse --short HEAD`).toString().replace('\n', ''),
  startedAt: `${getUTC().fulldate} ${getUTC().timeAccurate}`,
  startedMode: `${ProductionMode ? 'Production' : DevelopmentMode ? 'Development' : 'UNKNOWN'}${TestMode ? ' (Testing)' : ''}`,
  URL,
  env,
  vars,

  VALIDATION,
  DOMAIN,
  STATIC,
};



//! CHANGE HTTP PORT TO DEFAULT. IN PROD MODE THIS WILL BE MANAGED BY NGINX.
if (DevelopmentMode) {
  INTERNALS.http_server.port = 80;
}