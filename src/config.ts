import fs from 'fs';
import path from 'path';
import firebaseAdmin from 'firebase-admin';
import ip from 'ip';

import { TUserRoles } from './core/IUser';
import { IANIMEE_CONFIG } from './core/interfaces';

/** @deprecated */
const jwtSecrets = JSON.parse(fs.readFileSync(`${path.resolve()}/secrets/JWT.json`).toString()) as { accessTokenSecret: string, refreshTokenSecret: string };
const ANIMEE_CONFIG = JSON.parse(fs.readFileSync(`${path.resolve()}/../CONFIG.json`).toString()) as IANIMEE_CONFIG;

export const devMode = process.argv.includes('devMode');
export const prodMode = process.argv.includes('prodMode');

/** Test mode. In test mode some validation will pass in other ways */
export const testMode = process.argv.includes('testMode');

/** Main service config */
export const config = {
  /** DB object from global config */
  db: ANIMEE_CONFIG.SERVICES.DB,

  /** Current service object in global config */
  service: ANIMEE_CONFIG.SERVICES.ANIMEE_CORE,

  /** All service objects in global config */
  services: ANIMEE_CONFIG.SERVICES,

  /** Secrets */
  secrets: {
    /** @deprecated */
    jwtAccess: jwtSecrets.accessTokenSecret,

    /** @deprecated */
    jwtRefresh: jwtSecrets.refreshTokenSecret
  },

  /** Microservices local URLs */
  microservices: {
    /** Animee uploads URL */
    uploadsURL: `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.PORTS.HTTP}`,

    /** Animee uploads bot URL */
    uploadsBotURL: `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.PORTS.HTTP}`,

    /** Animee media URL */
    media: `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.PORTS.HTTP}`,

    /** Fullkekw user api url */
    usapi: `http://${getIP('0.0.0.0')}:45660`
  },

  /** URLs */
  URL: {
    /** Animee client URL */
    client: prodMode ? `https://animee.club` : `http://${getIP('0.0.0.0')}:3001`
  },

  /** Tests data */
  tests: {
    /** Tests data for DevController */
    DevController: {
      $1: {
        /** Dummy user with correct role */
        dummyRightID: 'dummy-devcontroller-1',

        /** Dummy user with root role */
        dummyRootID: 'dummy-devcontroller-0',

        /** Dummy user without required role */
        dummyID: 'dummy-devcontroller-2',
      }
    },
    UserController: {
      $1: {
        /** Dummy user for PATCH /user */
        dummyUser: 'dummy-usercontroller-0',

        /** Required for this test title id */
        titleId: '0fc90fe6-8dcf-4eaa-8080-f0d933e76266',
      }
    }
  },

  /** Service variables */
  vars: {
    /** Animee cookie with fullkekw usapi session */
    sessionCookieName: 'SEC_31N'
  }
};

//! CHANGE HTTP PORT TO DEFAULT. IN PROD MODE THIS WILL BE MANAGED BY NGINX.
if (devMode) {
  config.service.PORTS.HTTP = 80;
}

/** Initialize firebase
  * @deprecated Due to security update in 1.1.0
  * @since 1.1.0
*/
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(`${path.resolve()}/secrets/firebase.json`)
});

/** Default user avatars
 * @deprecated Due to security update in 1.1.0. Avatars will manage fullkekw usapi
  * @since 1.1.0
 */
export const defaultAvatars: string[] = [
  `https://api.animee.club/v1/media/05ba8cc3-3ede-420c-bc0a-2f6ae663b74f`,
  `https://api.animee.club/v1/media/7069ef7f-1ec9-4867-9fa2-ca1bf9e60643`,
  `https://api.animee.club/v1/media/1ea43878-36f0-416f-9f02-0b6eed54e411`
];

/** Change IP to current if it match 0.0.0.0 */
function getIP(raw: string): string {
  if (raw === '0.0.0.0') {
    return ip.address();
  } else {
    return raw;
  }
}

/** User default roles
 * @deprecated roles will be refacored in 1.1.0
 */
export const userDefaultRoles: TUserRoles[] = ['user'];