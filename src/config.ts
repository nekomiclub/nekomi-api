import fs from 'fs';
import path from 'path';
import firebaseAdmin from 'firebase-admin';
import { TUserRoles } from './core/IUser';
import ip from 'ip';
import { IANIMEE_CONFIG } from './core/interfaces';

const jwtSecrets = JSON.parse(fs.readFileSync(`${path.resolve()}/secrets/JWT.json`).toString()) as { accessTokenSecret: string, refreshTokenSecret: string };
const ANIMEE_CONFIG = JSON.parse(fs.readFileSync(`${path.resolve()}/../CONFIG.json`).toString()) as IANIMEE_CONFIG;

export const config = {
  db: ANIMEE_CONFIG.SERVICES.DB,
  service: ANIMEE_CONFIG.SERVICES.ANIMEE_CORE,
  services: ANIMEE_CONFIG.SERVICES,
  secrets: {
    jwtAccess: jwtSecrets.accessTokenSecret,
    jwtRefresh: jwtSecrets.refreshTokenSecret,
  },

  microservices: {
    uploadsURL: `http://${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.HOST}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.PORTS.HTTP}`,
    uploadsBotURL: `http://${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.HOST}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.PORTS.HTTP}`,
    media: `http://${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.HOST}:${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.PORTS.HTTP}`
  }
};

export const devMode = process.argv.includes('devMode');
export const prodMode = process.argv.includes('prodMode');
export const testMode = process.argv.includes('testMode');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(`${path.resolve()}/secrets/firebase.json`)
});

export const defaultAvatars: string[] = [
  `https://api.animee.club/v1/media/05ba8cc3-3ede-420c-bc0a-2f6ae663b74f`,
  `https://api.animee.club/v1/media/7069ef7f-1ec9-4867-9fa2-ca1bf9e60643`,
  `https://api.animee.club/v1/media/1ea43878-36f0-416f-9f02-0b6eed54e411`
];

export const userDefaultRoles: TUserRoles[] = ['user'];