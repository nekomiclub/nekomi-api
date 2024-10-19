import fs from 'fs';
import path from 'path';

import { HydratedDocument } from 'mongoose';
import UserModel from '../Models/User';
import { Logger } from '../services/LoggerService';
import { getUTC } from './handler';
import { config } from '../config';

export async function patchUserModel() {
  const startStamp = getUTC().timestamp;
  const users = await UserModel.find();

  Logger.info(`[ModelPatcher]: Patching user model started...`);

  stampDB('UserModel', users);

  for (const key in users) {
    const user = users[key];

    user.set('statistics.timeSpent', undefined, { strict: false });
    user.banner = config.vars.defaultUserBanner;

    await user.save();
  }

  Logger.info(`[ModelPatcher]: Patching user model ended within ${((getUTC().timestamp - startStamp) / 1000).toFixed(2)}s`);
}

function stampDB(model: string, documents: HydratedDocument<any>) {
  const dumpDir = `${path.resolve()}/.dump`;
  const dumpFile = `${dumpDir}/${model}-${getUTC().fulldate}-${getUTC().timeAccurate.replaceAll(':', '.')}.json`;

  if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir);
  fs.writeFileSync(dumpFile, JSON.stringify(documents));

  Logger.info(`Documents (${documents.length}) in ${model} stored at ${dumpFile}`);
}