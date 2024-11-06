import fs from 'fs';
import path from 'path';

import { HydratedDocument } from 'mongoose';
import UserModel from '../Models/User';
import { Logger } from '../services/LoggerService';
import { getUTC } from './handler';
import { config, CONSTS } from '../config';
import TitleModel from '../Models/Title';
import DubberModel from '../Models/Dubber';
import { getVideoDurationInSeconds } from 'get-video-duration';

export async function patchUserModel() {
  const startStamp = getUTC().timestamp;
  const users = await UserModel.find();

  Logger.info(`[ModelPatcher]: Patching user model started...`);

  stampDB('UserModel', users);

  for (const key in users) {
    const user = users[key];



    await user.save();
  }

  Logger.info(`[ModelPatcher]: Patching user model ended within ${((getUTC().timestamp - startStamp) / 1000).toFixed(2)}s`);
}

export async function patchDubberModel() {
  const startStamp = getUTC().timestamp;
  const dubbers = await DubberModel.find();

  Logger.info(`[ModelPatcher]: Patching dubber model started...`);

  stampDB('DubberModel', dubbers);

  for (const key in dubbers) {
    const dubber = dubbers[key];



    await dubber.save();
  }

  Logger.info(`[ModelPatcher]: Patching dubber model ended within ${((getUTC().timestamp - startStamp) / 1000).toFixed(2)}s`);
}

export async function patchTitleModel() {
  const startStamp = getUTC().timestamp;
  const titles = await TitleModel.find({ updatedAt: { $gt: 1730369100000 } });

  Logger.info(`[ModelPatcher]: Patching title model started...`);

  stampDB('TitleModel', titles);

  for (const key in titles) {
    const title = titles[key];

    const framelessEpisodes = title.episodes.filter(el => el.frames.length === 0);

    for (const fi in framelessEpisodes) {
      const episode = framelessEpisodes[fi];

      const id = new URL(episode.qualities.q1080).pathname.replace('/', '');
      const duration = await getVideoDurationInSeconds(episode.qualities.q1080);
      const previewsCount = Math.ceil(duration / 5);
      const framesCount = Math.ceil(previewsCount / 25);

      // Set frames URLs
      let i = 0;

      while (i < framesCount) {
        episode.frames.push(`${config.URL.nekomi_media}/${id}_f_${i}`);
        i++;
      }
    }

    title.markModified('episodes');
    await title.save();
  }

  Logger.info(`[ModelPatcher]: Patching title model ended within ${((getUTC().timestamp - startStamp) / 1000).toFixed(2)}s`);
}




function stampDB(model: string, documents: HydratedDocument<any>) {
  const dumpDir = `${path.resolve()}/.dump`;
  const dumpFile = `${dumpDir}/${model}-${getUTC().fulldate}-${getUTC().timeAccurate.replaceAll(':', '.')}.json`;

  if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir);
  fs.writeFileSync(dumpFile, JSON.stringify(documents));

  Logger.info(`Documents (${documents.length}) in ${model} stored at ${dumpFile}`);
}