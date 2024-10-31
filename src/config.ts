import fs from 'fs';
import path from 'path';

import { IANIMEE_CONFIG } from '../interfaces';
import CSRF from './secrets/CSRF';
import { preserveIP } from './handlers/handler';
import { IConfigData } from './interfaces/Interfaces';



const ANIMEE_DOMAIN = 'nekomi.club';
const FULLKEKW_DOMAIN = 'nekomi.club';

export const CONSTS = {
  Domains: {
    animee: ANIMEE_DOMAIN,
    animee_auth: `auth.${ANIMEE_DOMAIN}`,
    animee_client: ANIMEE_DOMAIN,
    animee_api: `api.${ANIMEE_DOMAIN}`,
    animee_media: `media.${ANIMEE_DOMAIN}`,
    animee_bot: `bot.${ANIMEE_DOMAIN}`,

    fullkekw: FULLKEKW_DOMAIN,
    fullkekw_authority: `authority.${FULLKEKW_DOMAIN}`,
    fullkekw_usapi: `usapi.${FULLKEKW_DOMAIN}`,
  }
};



const ANIMEE_CONFIG = JSON.parse(fs.readFileSync(`${path.resolve()}/../CONFIG.json`).toString()) as IANIMEE_CONFIG;

export const devMode = process.argv.includes('devMode');
export const prodMode = process.argv.includes('prodMode');
export const testMode = process.argv.includes('testMode');



const DATA: IConfigData = {
  HomeWrapped: {
    featured: prodMode ? [{
      id: '1db09f56-4ca8-4f11-9f6d-ca27ab682165',
      backgroundURL: '',
      videoURL: ''
    }] : [{
      id: '0bedcdb2-c666-4f90-9645-ad98f8bb53b7',
      backgroundURL: 'http://192.168.0.106:43120/devid-be3034c1-2a2f-465f-9e4c-e39219af4e47',
      videoURL: 'http://192.168.0.106:43120/devid-59cfe164-c5b4-4304-ba65-7d8cf8de493a'
    }],


    popular: prodMode ? [
      '10132d3e-366a-484b-8caa-be4d97e51f6b',
      '33f283ac-0c22-4266-8ced-96292fe7ce7e',
      '18be952e-40ae-4527-9266-042e3d813012',
      '72d081e4-7783-4e2e-8dc8-b6fcd8926964',
      'b4229fae-5908-4488-874d-57dce31d2ad7',
      '0b342f7c-515a-4f58-b309-2de334f79dc8',
    ] : [
      'testid-eb17fb44-5ecf-4309-8f95-5afed48accb2',
      'testid-ec179adf-742c-4b21-9784-eb57b90e0a10',
      '627690b0-f0c1-490d-b50e-c5ace32cd563',
      '2e546c6f-8545-4ea4-b9b9-3533d860d36a',
      'fc6868df-bd76-494e-840f-f7ff3dd67e2d'
    ]
  }
};

/** Head config */
export const config = {
  /** DB object from global config */
  db: ANIMEE_CONFIG.SERVICES.DB,

  /** Current service object in global config */
  service: ANIMEE_CONFIG.SERVICES.ANIMEE_CORE,

  /** All service objects in global config */
  services: ANIMEE_CONFIG.SERVICES,

  /** Secrets */
  secrets: {
    /* CSRF Token */
    CSRF
  },

  /** URLs */
  URL: {
    /** Animee client */
    client: prodMode ? `https://${CONSTS.Domains.animee_client}` : `http://${preserveIP('0.0.0.0')}:3001`,

    /** Animee Media */
    media: prodMode ? `https://${CONSTS.Domains.animee_media}` : `http://${preserveIP(ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.PORTS.HTTP}`,

    /** Anime API base url */
    baseURL: prodMode ? `https://${CONSTS.Domains.animee_api}` : `http://${preserveIP('0.0.0.0')}`,

    /** Fullkekw authority service */
    fullkekw_authority: prodMode ? `https://${CONSTS.Domains.fullkekw_authority}` : `http://${preserveIP('0.0.0.0')}:45010`,

    /** Fullkekw user API */
    fullkekw_usapi: prodMode ? CONSTS.Domains.fullkekw_usapi : `http://${preserveIP('0.0.0.0')}:45660`,

    //* Local services

    /** Animee Bot */
    bot: `http://${preserveIP(ANIMEE_CONFIG.SERVICES.ANIMEE_BOT.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_BOT.PORTS.HTTP}`,

    /** Animee uploads */
    uploads: `http://${preserveIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.PORTS.HTTP}`,

    /** Animee uploads bot */
    uploadsBot: `http://${preserveIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.PORTS.HTTP}`,
  },

  /** Service variables */
  vars: {
    /** Use it ONLY FOR INTERNAL CHANGE PURPOSES, or you will be fired :) */
    INTERNAL_ROOT_USER_ID: 'animeeclub',

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
    defaultAvatar: 'http://example.com',

    /** Default banner for users */
    defaultUserBanner: 'http://example.com',

    /** Default poster for nekomi titles */
    defaultPoster: 'http://example.com',
  },

  DATA
};

export const RULES = {
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
  }
};



//! CHANGE HTTP PORT TO DEFAULT. IN PROD MODE THIS WILL BE MANAGED BY NGINX.
if (devMode) {
  config.service.PORTS.HTTP = 80;
}