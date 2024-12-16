import fs from 'fs';
import path from 'path';

import DubberModel from '../Models/Dubber';
import TitleModel from '../Models/Title';
import UserModel from '../Models/User';
import { HydratedDocument } from 'mongoose';
import { ITitle } from '../interfaces/Title';
import { Logger } from '../services/LoggerService';
import { TitleService } from '../Models/Title';
import { config } from '../config';
import { getUTC } from './handler';



export async function patchUserModel() {
  const startStamp = getUTC().timestamp;
  const users = await UserModel.find();

  Logger.info(`[ModelPatcher]: Patching user model started...`);

  stampDB('UserModel', users);

  for (const key in users) {
    const user = users[key];

    user.statistics.dubber_team_member = null;
    user.markModified('statistics');

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

    dubber.set('thumbURL', undefined, { strict: false });
    dubber.set('rating', undefined, { strict: false });
    dubber.set('leader', undefined, { strict: false });
    dubber.set('editors', undefined, { strict: false });
    dubber.set('membersInvitePending', undefined, { strict: false });

    dubber.statistics = {
      createdAt: dubber.createdAt
    };

    dubber.slug = dubber.code;
    dubber.nameUkr = dubber.name;
    dubber.nameEng = dubber.code;
    dubber.banner = config.vars.defaultUserBanner;

    dubber.members = [];
    dubber.membersInvited = [];

    dubber.set('statistics.created_at', undefined, { strict: false });
    dubber.set('name_ukr', undefined, { strict: false });
    dubber.set('name_eng', undefined, { strict: false });
    dubber.set('members_invited', undefined, { strict: false });

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



    await title.save();
  }

  Logger.info(`[ModelPatcher]: Patching title model ended within ${((getUTC().timestamp - startStamp) / 1000).toFixed(2)}s`);
}



export async function loadTitles() {
  const startedAt = getUTC().timestamp;
  const titles = JSON.parse(fs.readFileSync(`${path.resolve()}/src/load-titles.json`).toString()).titles as ITitle[];

  stampDB('LoadTitles', titles);
  Logger.info('Start loading titles from the file...');

  for (const key in titles) {
    const title = titles[key];
    const { ageRate, country, description, genres, id, names, poster, season, status, studios, type, year } = title;

    await TitleService.create({
      ageRate,
      country,
      description,
      details: title.details ?? undefined,
      episodesCount: title.episodesCount ?? undefined,
      genres,
      id,
      names,
      season,
      status,
      studios,
      type,
      year,
      mal_id: title.mal_id ?? undefined,
      poster,
    });
  }

  Logger.info(`Ended loading titles from file within ${((getUTC().timestamp - startedAt) / 1000).toFixed(2)} with pushed ${titles.length} titles`);
}




function stampDB(model: string, documents: HydratedDocument<any>) {
  const dumpDir = `${path.resolve()}/.dump`;
  const dumpFile = `${dumpDir}/${model}-${getUTC().fulldate}-${getUTC().timeAccurate.replaceAll(':', '.')}.json`;

  if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir);
  fs.writeFileSync(dumpFile, JSON.stringify(documents));

  Logger.info(`Documents (${documents.length}) in ${model} stored at ${dumpFile}`);
}