import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface IEnv {
  HTTP_PORT: number,
  HTTPS_PORT: number,
  IP: string,
  MONGODB_PROD_URI: string
  MONGODB_DEV_URI: string
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
  `https://api.animee.club/v1/media/31451ae9-c655-4193-bc31-511dacdb5cbd`,
  `https://api.animee.club/v1/media/76d2c8c8-2eac-497b-83dc-8dd484e9b242`,
  `https://api.animee.club/v1/media/8b3d7adb-4b33-4e59-a32f-49a8a6cdd343`,
  `https://api.animee.club/v1/media/df807b70-4969-49ae-bedd-9b9cab3361b8`,
  `https://api.animee.club/v1/media/d5c85c39-bf64-4cb3-bdbb-cbeeeb425524`,
  `https://api.animee.club/v1/media/14b36afb-3e65-454b-a1ab-e9290cf484b3`,
];

export default cfg;