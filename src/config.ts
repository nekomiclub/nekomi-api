import fs from 'fs';
import path from 'path'

interface ICfg {
  storageURIs: string[]
}

const devMode = process.argv.some(el => el === 'devMode');

export const cfg: ICfg = {
  storageURIs: devMode ? [
    `${path.resolve()}/testStorage`,
  ] : [
    `/media/unniiiverse/Storage_0/animee-storage`,
    `/media/unniiiverse/Storage_1/animee-storage`,
  ]
};

export default cfg;