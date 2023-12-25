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
import inquirer from 'inquirer';
import { createPreview } from '../../services/v1/processMedia';

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

import bcrypt from 'bcrypt';
import { MONGO_URI } from '../../index';
import { ITitleEpisodeDubbed, ITitleEpisodesDub } from 'src/core/ITitle';

export async function dbClearout() {
  console.log(`CLEAROUT DETAILS:\nDevMode: ${devMode}\nTestMode: ${testMode}\nURI: ${MONGO_URI}`);
  const results = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'dbClearout-confirm',
      message: 'YOU WANT TO MAKE DB CLEAROUT. PLEASE CONFIRM THAT ACTION.'
    },
    {
      type: 'password',
      name: 'dbClearout-password',
      message: 'DB CLEAROUT CONFIRMED. ENTER ROOT PASSWORD.'
    }
  ]);

  if (!bcrypt.compareSync(results['dbClearout-password'], '$2b$10$nYa/cYnfjl7V98GZ9pyz4O5mmwmGunetw/FDvvgPRxUkp3BigcQna')) {
    throw new Error('CLEAROUT FORBIDDEN');
  }


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

export async function updateDubbers() {
  const dubbers = await Dubbers.find();

  dubbers.forEach(async dubber => {
    dubber.socials = {
      instagram: null,
      telegram: null,
      tiktok: null,
      youtube: null
    };

    dubber.support = {
      bymeacoffee: null,
      diaka: null,
      monobank: null,
      patreon: null,
      privatbank: null
    };

    dubber.createdAt = +new Date();
    dubber.description = null;
    dubber.leader = null;
    dubber.editors = null;
    dubber.members = null;
    dubber.rating = 9;

    await dubber.save();
  });
}

export async function updatePreviewFrames() {
  let titles = await Title.find();
  // titles = titles.filter(el => el.id === '123');

  for (const titleI in titles) {
    // Get title
    const title = titles[titleI];
    let startTimestamp = +new Date()

    // If no dubs presented skip
    if (!title.dubs?.length) continue;

    console.log(`Start updating frames for ${title.code}`);

    for (const dubI in title.dubs) {
      // Get dub
      const dub = title.dubs[dubI] as ITitleEpisodesDub;

      for (const epI in dub.eps) {
        const ep = dub.eps[epI];
        const id = ep.source.q1080!.split('/media/')[1];
        const updatedFrames: string[] = [];
        const TID = testMode ? `testid-${(Math.random() + 1).toString(36).substring(8)}` : (Math.random() + 1).toString(36).substring(8);

        // Delete all prev frames
        for (const frameI in ep.framesURL) {
          const frame = ep.framesURL[frameI];
          const frameId = frame.split('/media/')[1];

          const item = await Storage.findOne({ id: frameId });

          if (item) {
            await item.deleteOne();

            try {
              fs.rmSync(item.URI);
            } catch (e) {
              null;
            }
          }
        }

        const frames = await createPreview(id, TID, ep.source.q1080!);

        let i = 0;
        while (i < frames) {
          updatedFrames.push(`${devMode ? `http://${ip.address()}` : `https://api.animee.club`}/v1/media/${id}_f_${i}`);
          i++;
        }

        title.dubs.find(el => el.id === dub.id)!.eps.find(el => el.order === ep.order)!.framesURL = updatedFrames;
      }

    }

    console.log(JSON.stringify(title, null, 2));
    await Title.findOneAndUpdate({ id: title.id }, { dubs: title.dubs });

    console.log(`- - - END UPDATING ${title.code} via ${((+new Date() - startTimestamp) / 1000).toFixed(2)}s - - -`);
  }
}
