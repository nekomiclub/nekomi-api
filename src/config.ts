import fs from 'fs';
import path from 'path';
import ip from 'ip';

import { IANIMEE_CONFIG } from '../interfaces';
import CSRF from './secrets/CSRF';
import { preserveIP } from './handlers/handler';


const ANIMEE_CONFIG = JSON.parse(fs.readFileSync(`${path.resolve()}/../CONFIG.json`).toString()) as IANIMEE_CONFIG;

export const devMode = process.argv.includes('devMode');
export const prodMode = process.argv.includes('prodMode');
export const testMode = process.argv.includes('testMode');



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
  } as const,

  /** URLs */
  URL: {
    /** Animee client */
    client: prodMode ? `https://animee.club` : `http://${preserveIP('0.0.0.0')}:3001`,

    /** Animee updater */
    updater: prodMode ? `https://updater.animee.club` : `http://${preserveIP('0.0.0.0')}:3000`,

    /** Animee Media */
    media: prodMode ? `https://media.animee.club` : `http://${preserveIP(ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.PORTS.HTTP}`,

    /** Animee Bot */
    bot: `http://${preserveIP(ANIMEE_CONFIG.SERVICES.ANIMEE_BOT.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_BOT.PORTS.HTTP}`,

    /** Anime API base url */
    baseURL: prodMode ? `https://api.animee.club` : `http://${preserveIP('0.0.0.0')}`,


    //* Fullkekw services

    /** Fullkekw authority service */
    fullkekw_authority: prodMode ? `https://authority.animee.club` : `http://${preserveIP('0.0.0.0')}:45010`,


    //* Local services

    /** Fullkekw user API */
    fullkekw_usapi: `http://${preserveIP('0.0.0.0')}:45660`,

    /** Animee uploads */
    uploads: `http://${preserveIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.PORTS.HTTP}`,

    /** Animee uploads bot */
    uploadsBot: `http://${preserveIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.PORTS.HTTP}`,
  } as const,

  /** Service variables */
  vars: {
    /** Use it ONLY FOR INTERNAL CHANGE PURPOSES, or you will be fired :) */
    INTERNAL_ROOT_USER_ID: 'animeeclub',

    /** Animee cookie with fullkekw usapi session */
    sessionCookie: 'SEC_31N',

    /** Animee cookie expiration offset */
    sessionCookieExpireOffset: 2592000000,

    /** Mock data header */
    mockHeader: 'X-MockData',

    /** CSRF Token header name */
    csrfHeader: 'X-CSRF-Token',

    /** Production IP */
    prodIP: '192.168.0.107',

    /** CSRF token expiration */
    CSRF_EXPIRE: 180000,

    /** Service domain */
    domain: 'api.animee.club',

    /** Default avatar for new animee creations */
    defaultAvatar: 'http://example.com',

    /** Default poster for new animee titles */
    defaultPoster: 'http://example.com',
  } as const
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