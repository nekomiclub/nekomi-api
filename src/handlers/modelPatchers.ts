import fs from 'fs';
import path from 'path';

import DubberModel from '../Models/Dubber';
import TitleModel from '../Models/Title';
import UserModel from '../Models/User';
import { HydratedDocument } from 'mongoose';
import { Logger } from '../services/LoggerService';
import { getUTC } from './handler';

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
  const titles = await TitleModel.find();

  Logger.info(`[ModelPatcher]: Patching title model started...`);

  stampDB('TitleModel', titles);

  for (const key in titles) {
    const title = titles[key];

    title.mal_id = null;
    title.rating.mal = null;

    title.hikkiSyncedAt = 0;
    title.rating.mal_poll = 0;

    title.markModified('mal_id');
    title.markModified('hikkiSyncedAt');
    title.markModified('rating');

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