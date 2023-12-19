import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Dubbers from '../../Models/Dubber';
import Storage from '../../Models/Storage';
import Title from '../../Models/Title';
import { env, cfg, testMode, devMode } from '../../config';
import * as uuid from 'uuid';
import ip from 'ip';
import axios from 'axios';

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

import uploadDB from '../../localDB/uploadDB.json' assert {type: 'json'};
export async function clearout() {
  const root = path.resolve();

  fs.readdirSync(`${root}/tmp/processing`).forEach(tid => {
    fs.readdirSync(`${root}/tmp/processing/${tid}`).forEach(file => {
      if (+file.split('-')[1] < (getUTCTime() - 1000 * 60 * 60 * 24 * 3)) {
        fs.rmSync(`${root}/tmp/processing/${tid}`, { recursive: true, force: true });
      }
    });
  });

  if (!uploadDB.queue.length) {
    fs.readdirSync(`${root}/pw`).forEach(tid => fs.rmSync(`${root}/pw/${tid}`, { recursive: true, force: true }));
    fs.readdirSync(`${root}/tmp/uploads`).forEach(upload => fs.rmSync(`${root}/tmp/uploads/${upload}`, { recursive: true, force: true }));
  }
}

export async function dbClearout() {
  const storage = await Storage.find();
  storage.forEach(async item => {
    try {
      if (devMode && item.URI.match(/\/media/gi)) return;
      await axios.get(devMode ? `http://${ip.address()}/v1/media/${item.id}` : `https://api.animee.club/v1/media/${item.id}`);
    } catch (e) {
      console.log(`${item.id} deleted as unavailable`);
      await Storage.findOneAndDelete({ id: item.id });
    }
  });
}

export async function uploadFile(path: string): Promise<string> {
  const id = testMode ? `testid-${uuid.v4()}` : uuid.v4();
  const destURI = `${cfg.storageURIs[0]}/${id}.${getFileExtension(path.split('/')[3])}`;

  fs.copyFileSync(path, destURI);

  const item = new Storage({
    id,
    dateAdded: getUTCTime(),
    URI: destURI
  });

  await item.save();
  return item.id;
}

export function getUTCTime(): number {
  return +new Date().setUTCHours(new Date().getUTCHours());
}