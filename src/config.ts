import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { config as dotenvCfg } from 'dotenv';
import { execSync } from 'child_process';

import getUTC from './utils/get-utc';
import preserveIP from './utils/preserve-ip';
import { ISERVICE_CONFIG } from '../SERVICE_CONFIG';



// Preflight
chalk.level = 1;
dotenvCfg();



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
      id: 'df5023cf-34d6-4672-9cae-84d0e1845138',
      backgroundURL: 'https://media.nekomi.club/b1c045da-605f-46b9-be13-ffe391927f57',
      videoURL: 'https://media.nekomi.club/4f609afb-c82f-4012-bec6-b987fade7d1f'
    }, {
      id: 'f846581c-0c8c-4d73-84aa-76d5ed928453',
      backgroundURL: 'https://media.nekomi.club/0729c26a-52b3-465c-a030-db683df68d09',
      videoURL: 'https://media.nekomi.club/ea9a007c-017f-42c0-a94d-34729884c5d6'
    }] : [{
      id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
      backgroundURL: 'https://media.nekomi.club/0729c26a-52b3-465c-a030-db683df68d09',
      videoURL: 'https://media.nekomi.club/ea9a007c-017f-42c0-a94d-34729884c5d6'
    }, {
      id: 'df5023cf-34d6-4672-9cae-84d0e1845138',
      backgroundURL: 'https://media.nekomi.club/b1c045da-605f-46b9-be13-ffe391927f57',
      videoURL: 'https://media.nekomi.club/4f609afb-c82f-4012-bec6-b987fade7d1f'
    }],


    popular: ProductionMode ? [
      'f846581c-0c8c-4d73-84aa-76d5ed928453',
      '89186167-012a-4f2f-baba-386506219499',
      'd59f2791-06b7-4288-910b-2d63532529c7',
      '185a03d1-43e6-40aa-87ee-604ace1ad872',
      '0bb51720-4797-40c5-9898-e8b2aba90f27',
      'd25f540d-c1a9-41b5-923f-d0eae93dce9b',
      '3fd37e65-c7a5-415f-bb14-8fb248cfe3bb',
      '9df91c38-1cb3-49ca-ae42-d43be59afe89',
      'e395bd75-fa4e-4971-a175-84d6392ec8db',
      'fa4b5af3-977d-4ca7-8e22-a65eb45ae061',
      'a0993d0e-3088-4a79-b3b5-00b3104b2f74',
      '354205aa-14e3-4b3c-8b72-6f96a1effdee',
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

  /** CSRF token expiration */
  CSRF_EXPIRE: 180000,

  /** Default avatar */
  defaultAvatar: 'https://media.nekomi.club/0849e678-43ee-4f72-ae5a-bb9ff9d86c89',

  /** Default banner */
  defaultBanner: 'https://media.nekomi.club/efe3322f-69db-4084-b21b-5e139978292c',

  /** Default anime poster */
  defaultPoster: 'https://media.nekomi.club/cd0c5c50-8e72-4c13-a40d-01ef3d43f918',
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