import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import firebaseAdmin from 'firebase-admin';
import jwtSecrets from '../secrets/JWT.json' assert {type: 'json'};
import { TUserRoles } from './core/IUser';
import ip from 'ip';
import { IANIMEE_CONFIG_SERVICE } from './core/interfaces';

dotenv.config();

export type TOSPlatform = 'win32' | 'linux' | 'aix' | 'darwin' | 'freebsd' | 'openbsd' | 'sunos'; // See https://nodejs.org/api/os.html#osplatform

interface IEnv {
  HTTP_PORT: number,
  HTTPS_PORT: number,
  WS_PORT: number,
  IP: string,
  MONGODB_PROD_URI: string
  MONGODB_DEV_URI: string,
  JWT_SECRET_ACCESS: string,
  JWT_SECRET_REFRESH: string,
  platform: TOSPlatform
}

interface IANIMEE_CONFIG {
  PORTS: {
    BASE_PORT: number,

    CORE: {
      HTTP: number,
      HTTPS: number
    },

    ANIMEE_UPLOADS: {
      MSID: number
    },
    ANIMEE_UPLOADS_BOT: {
      MSID: number
    },
    MONGODB: {
      PORT: number,
      HOST: string
    }
  },
  SERVICES: {
    DB: {
      PORT: number,
      HOST: number,
    },

    ANIMEE_CORE: IANIMEE_CONFIG_SERVICE,
    ANIMEE_MEDIA: IANIMEE_CONFIG_SERVICE,
    ANIMEE_UPLOADS: IANIMEE_CONFIG_SERVICE,
    ANIMEE_UPLOADS_BOT: IANIMEE_CONFIG_SERVICE,
  }
}

const ANIMEE_CONFIG = JSON.parse(fs.readFileSync(`${path.resolve()}/../CONFIG.json`).toString()) as IANIMEE_CONFIG;

export const config = {
  db: ANIMEE_CONFIG.SERVICES.DB,
  service: ANIMEE_CONFIG.SERVICES.ANIMEE_CORE,
  services: ANIMEE_CONFIG.SERVICES,

  microservices: {
    uploadsURL: `http://${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.HOST}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.PORTS.HTTP}`,
    uploadsBotURL: `http://${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.HOST}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.PORTS.HTTP}`,
    media: `http://${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.HOST}:${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.PORTS.HTTP}`
  }
};

// @ts-ignore
export const env = process.env as IEnv;

env.platform = process.platform as TOSPlatform;
env.JWT_SECRET_ACCESS = jwtSecrets.accessTokenSecret;
env.JWT_SECRET_REFRESH = jwtSecrets.refreshTokenSecret;

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