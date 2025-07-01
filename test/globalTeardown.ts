// ! JEST TEARDOWN

import AnimeModel from '../src/_core/models/AnimeModel';
import DubberModel from '../src/_core/models/DubberModel';
import mongoose from 'mongoose';
import { config as dotenvCfg } from 'dotenv';



dotenvCfg();



const env = {
  DATABASE_HOST: String(process.env['DATABASE_HOST']),
  DATABASE_PORT: Number(process.env['DATABASE_PORT']),
  DATABASE_NAME: String(process.env['DATABASE_NAME']),
  DATABASE_USR: String(process.env['DATABASE_USR']),
  DATABASE_PWD: String(process.env['DATABASE_PWD']),
};

export default async function () {
  const purgeRegex = /^~test/;

  mongoose.set('strictQuery', false);
  mongoose.connect(`mongodb://${env.DATABASE_USR}:${env.DATABASE_PWD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`, {
    retryWrites: true,
  });

  await AnimeModel.deleteMany({ uuid: { $regex: purgeRegex } });
  await DubberModel.deleteMany({ id: { $regex: purgeRegex } });

  console.log(`[Jest]: =================================`);
  console.log(`[Jest]: Test teardown. Documents with id that match ~test were purged`);
  console.log(`[Jest]: =================================`);
}