import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Dubbers from '../../Models/Dubber';
import Storage from '../../Models/Storage';
import Title from '../../Models/Title';
import { env, cfg, testMode, devMode } from '../../config';
import * as uuid from 'uuid';
import ip from 'ip';

export function writeToLog(msg: string) {
  const time = `${new Date().getUTCDate()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCFullYear()} (${new Date().getUTCHours()}:${new Date().getUTCMinutes()})`;
  fs.appendFileSync(`${path.resolve()}/.log`, `\nINFO (UTC ${time}): ${msg}`);
}

export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
}

export function createInitArchitecture() {
  const root = path.resolve();
  const tmp = `${root}/tmp`;
  const processing = `${tmp}/processing`;
  const uploads = `${tmp}/uploads`;

  const pw = `${root}/pw`;
  const testStorage = `${root}/testStorage`;

  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
  if (!fs.existsSync(processing)) fs.mkdirSync(processing);
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads);
  if (!fs.existsSync(pw)) fs.mkdirSync(pw);
  if (!fs.existsSync(testStorage)) fs.mkdirSync(testStorage);
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

export async function clearTestIDs() {
  await Dubbers.deleteMany({ id: { $regex: /^testid-/g } });
  await Title.deleteMany({ id: { $regex: /^testid-/g } });
  await Storage.deleteMany({ id: { $regex: /^testid-/g } });

  const root = path.resolve();

  const testURIs: string[] = [...cfg.storageURIs, `${root}/tmp/processing`, `${root}/tmp/uploads`];
  testURIs.forEach(uri => {
    const storage = fs.readdirSync(uri);

    storage.forEach(file => {
      if (!file.match(/^testid-/g)) {
        return;
      }

      fs.rmSync(`${uri}/${file}`, { recursive: true });
    });
  });

  return true;
}

export async function createDubbers() {
  const dubbers = ['Didko Studio', 'Ukrsub', 'Kioto Anime', 'Amanogawa', 'Dzuski', 'FanVoxUA'];
  const dubbersAvatarURIs = [`${path.resolve()}/test/dubbers/didko.jpg`, `${path.resolve()}/test/dubbers/ukrsub.jpg`, `${path.resolve()}/test/dubbers/kioto-anime.jpg`, `${path.resolve()}/test/dubbers/amanogawa.jpg`, `${path.resolve()}/test/dubbers/dzuski.jpg`, `${path.resolve()}/test/dubbers/fanvoxua.jpg`];

  dubbers.forEach(async (dub, i) => await createDubber(dub, await uploadFile(dubbersAvatarURIs[i])));
}

export async function createDubber(name: string, avatarID: string) {
  const code = name.toLowerCase().replaceAll(' ', '-');
  console.log(avatarID);

  const item = new Dubbers({
    id: testMode ? `testid-${uuid.v4()}` : uuid.v4(),
    code,
    name,
    thumbURL: `http://${devMode ? ip.address() : 'api.animee.club'}:${devMode ? env.PORT : 8080}/v1/media/${avatarID}`
  });

  await item.save();
}

export async function uploadFile(path: string): Promise<string> {
  const id = testMode ? `testid-${uuid.v4()}` : uuid.v4();
  const destURI = `${cfg.storageURIs[0]}/${id}.${getFileExtension(path.split('/')[3])}`;

  fs.copyFileSync(path, destURI);

  const item = new Storage({
    id,
    dateAdded: +new Date(),
    URI: destURI
  });

  await item.save();
  return item.id;
}