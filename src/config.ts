import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface IEnv {
  PORT: number,
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

export default cfg;