import fs from 'fs';
import path from 'path';

import { HydratedDocument } from 'mongoose';
import UserModel from '../Models/User';
import { Logger } from '../services/LoggerService';
import { getUTC } from './handler';
import { config, CONSTS } from '../config';
import TitleModel from '../Models/Title';
import DubberModel from '../Models/Dubber';

export async function patchUserModel() {
  const startStamp = getUTC().timestamp;
  const users = await UserModel.find();

  Logger.info(`[ModelPatcher]: Patching user model started...`);

  stampDB('UserModel', users);

  for (const key in users) {
    const user = users[key];

    user.avatar = user.avatar.replace('animee.club', 'nekomi.club');
    user.banner = user.banner.replace('animee.club', 'nekomi.club');

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

    dubber.avatar = dubber.avatar.replace('animee.club', 'nekomi.club');
    dubber.thumbURL = dubber.thumbURL.replace('animee.club', 'nekomi.club');

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

    title.poster = title.poster.replace('animee.club', 'nekomi.club');

    title.episodes = title.episodes.map(ep => {
      ep.frames = ep.frames.map(frame => frame.replace('animee.club', 'nekomi.club'));
      ep.qualities.q4k ? ep.qualities.q4k = ep.qualities.q4k.replace('animee.club', 'nekomi.club') : null;
      ep.qualities.q1080 ? ep.qualities.q1080 = ep.qualities.q1080.replace('animee.club', 'nekomi.club') : null;
      ep.qualities.q720 ? ep.qualities.q720 = ep.qualities.q720.replace('animee.club', 'nekomi.club') : null;
      ep.qualities.q480 ? ep.qualities.q480 = ep.qualities.q480.replace('animee.club', 'nekomi.club') : null;
      ep.qualities.q240 ? ep.qualities.q240 = ep.qualities.q240.replace('animee.club', 'nekomi.club') : null;

      return ep;
    });

    title.markModified('poster');
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