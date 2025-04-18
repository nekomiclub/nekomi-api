// ! JEST TEARDOWN

import AnimeModel from '../src/_core/models/AnimeModel';
import DubberModel from '../src/_core/models/DubberModel';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';


const SERVICE_CONFIG = JSON.parse(fs.readFileSync(`${path.resolve()}/../SERVICE_CONFIG.json`).toString());

const INTERNALS = {
  database: {
    host: SERVICE_CONFIG.DATABASE!.host,
    port: SERVICE_CONFIG.DATABASE!.port,
    creds: SERVICE_CONFIG.SERVICES.nekomi_api.DATABASE!.development
  }
};

export default async function () {
  const purgeRegex = /^~test/;

  mongoose.set('strictQuery', false);
  mongoose.connect(`mongodb://${INTERNALS.database.creds!.usr}:${INTERNALS.database.creds!.pwd}@${INTERNALS.database.host}:${INTERNALS.database.port}/${INTERNALS.database.creds!.name}`, {
    retryWrites: true,
  });

  await AnimeModel.deleteMany({ uuid: { $regex: purgeRegex } });
  await DubberModel.deleteMany({ id: { $regex: purgeRegex } });

  console.log(`[Jest]: Test teardown`);
}