import fs from 'fs';
import path from 'path';
import ip from 'ip';

import { IANIMEE_CONFIG } from '../interfaces';
import { writeLog } from './handlers/Errors';
import { SEC_CSRF } from './secrets';


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
    CSRF: SEC_CSRF
  },

  /** URLs */
  URL: {
    /** Animee client */
    client: prodMode ? `https://animee.club` : `http://${getIP('0.0.0.0')}:3001`,

    /** Animee updater */
    updater: prodMode ? `https://updater.animee.club` : `http://${getIP('0.0.0.0')}:3000`,

    /** Media */
    media: prodMode ? `https://media.animee.club` : `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.PORTS.HTTP}`,


    //* Fullkekw services

    /** Fullkekw authority service */
    fullkekw_authority: prodMode ? `https://authority.animee.club` : `http://${getIP('0.0.0.0')}:45010`,


    //* Local services

    /** Fullkekw user API */
    fullkekw_usapi: `http://${getIP('0.0.0.0')}:45660`,

    /** Animee uploads */
    uploads: `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.PORTS.HTTP}`,

    /** Animee uploads bot */
    uploadsBot: `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.PORTS.HTTP}`,
  },

  /** Service variables */
  vars: {
    /** Animee cookie with fullkekw usapi session */
    sessionCookie: 'SEC_31N',

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
  }
};

/** Service mocked data interface */
export interface IMockedData<T = any> {
  id: string,
  code: number,
  data: T
}



//! CHANGE HTTP PORT TO DEFAULT. IN PROD MODE THIS WILL BE MANAGED BY NGINX.
if (devMode) {
  config.service.PORTS.HTTP = 80;
}

/** Check service filesystem validity */
export async function checkFilesystem() {
  const self = path.resolve();

  const requiredFolders = [
    `${self}/logs`,
  ];

  const requiredFiles = [
    `${self}/logs/.log`,
    `${self}/logs/error.log`,
    `${self}/logs/fatal.log`,
  ];

  requiredFolders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
      writeLog('info', `Not existing ${folder} created`, 'checkFilesystem');
    }
  });

  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '');
      writeLog('info', `Not existing ${file} created`, 'checkFilesystem');
    }
  });
}

/** Change IP to current if it match 0.0.0.0 */
function getIP(raw: string): string {
  if (raw === '0.0.0.0') {
    return ip.address();
  } else {
    return raw;
  }
}