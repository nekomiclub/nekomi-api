import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface IEnv {
  HTTP_PORT: number,
  HTTPS_PORT: number,
  IP: string,
  MONGODB_PROD_URI: string
  MONGODB_DEV_URI: string,
  JWT_SECRET_ACCESS: string,
  JWT_SECRET_REFRESH: string,
}

interface ICfg {
  storageURIs: string[]
}

// @ts-ignore
export const env = process.env as IEnv;
export const devMode = process.argv.some(el => el === 'devMode');
export const testMode = process.argv.some(el => el === 'testMode');

export const cfg: ICfg = {
  storageURIs: devMode ? [
    `${path.resolve()}/testStorage`,
  ] : [
    `/media/unniiiverse/Storage_0/animee-storage`,
    `/media/unniiiverse/Storage_1/animee-storage`,
  ]
};

export const defaultAvatars: string[] = [
  `https://api.animee.club/v1/media/05ba8cc3-3ede-420c-bc0a-2f6ae663b74f`,
  `https://api.animee.club/v1/media/7069ef7f-1ec9-4867-9fa2-ca1bf9e60643`,
  `https://api.animee.club/v1/media/1ea43878-36f0-416f-9f02-0b6eed54e411`
];

export default cfg;