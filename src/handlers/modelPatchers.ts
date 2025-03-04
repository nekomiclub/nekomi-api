import fs from 'fs';
import path from 'path';

import DubberModel from '~/core/models/DubberModel';
import TitleModel from '../models/Title';
import UserModel from '../models/User';
import { ANIME_GENRES, ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, AnimeGenre } from '~/interfaces/Anime.intf';
import { HydratedDocument } from 'mongoose';
import { Logger } from '../services/LoggerService';
import { createSlug } from '~/utils/create-slug';
import { getUTC } from './handler';



export async function patchUserModel() {
  const startStamp = getUTC().timestamp;
  const users = await UserModel.find();

  Logger.info(`[ModelPatcher]: Patching user model started...`);

  stampDB('UserModel', users);

  for (const key in users) {
    const user = users[key];

    user.statistics.dubberTeamMember = user.statistics.dubber_team_member;

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



    await dubber.save();
  }

  Logger.info(`[ModelPatcher]: Patching dubber model ended within ${((getUTC().timestamp - startStamp) / 1000).toFixed(2)}s`);
}

export async function patchAnimeModel() {
  const startStamp = getUTC().timestamp;
  const titles = await TitleModel.find();

  Logger.info(`[ModelPatcher]: Patching title model started...`);

  stampDB('AnimeModel', titles);

  for (const key in titles) {
    const anime = titles[key];

    anime.set('hikkaSyncedAt', undefined, { strict: false });

    anime.malId = anime.malId ? anime.malId : anime.mal_id !== null ? +anime.mal_id : null;
    anime.slug = anime.slug ?? anime.code;
    anime.related = anime.related ?? [];
    anime.pictures = anime.pictures ?? [];
    anime.studiosNew = anime.studiosNew ?? [];
    anime.broadcast = anime.broadcast ?? null;
    anime.malSyncedAt = anime.malSyncedAt ?? null;
    anime.uuid = anime.id;

    anime.score = anime.score ?? {
      imdb: anime.rating.IMDB,
      mal: anime.rating.mal,
      malScoredBy: anime.rating.mal_poll,
    };

    //* Mapper anime.ageRate
    if (anime.ageRate === 'G') anime.rate = ANIME_RATE.G;
    if (anime.ageRate === 'PG') anime.rate = ANIME_RATE.PG;
    if (anime.ageRate === 'PG-13') anime.rate = ANIME_RATE.PG13;
    if (anime.ageRate === 'R-17') anime.rate = ANIME_RATE.R17;
    if (anime.ageRate === 'R+') anime.rate = ANIME_RATE.RPLUS;
    if (anime.ageRate === 'Rx') anime.rate = ANIME_RATE.RX;

    //* Mappper anime.status
    if (anime.status === 'announcement') anime.statusNew = ANIME_STATUS.NOT_YET_AIRED;
    if (anime.status === 'delayed') anime.statusNew = ANIME_STATUS.CURRENTLY_AIRING;
    if (anime.status === 'ongoing') anime.statusNew = ANIME_STATUS.CURRENTLY_AIRING;
    if (anime.status === 'out') anime.statusNew = ANIME_STATUS.FINISHED_AIRING;

    //* Mapper anime.season
    if (anime.season === 'autumn') anime.seasonNew = ANIME_SEASON.FALL;
    if (anime.season === 'spring') anime.seasonNew = ANIME_SEASON.SPRING;
    if (anime.season === 'summer') anime.seasonNew = ANIME_SEASON.SUMMER;
    if (anime.season === 'winter') anime.seasonNew = ANIME_SEASON.WINTER;

    //* Mapper anime.type
    if (anime.type === 'ONA') anime.media = ANIME_MEDIA_TYPE.ONA;
    if (anime.type === 'OVA') anime.media = ANIME_MEDIA_TYPE.OVA;
    if (anime.type === 'film') anime.media = ANIME_MEDIA_TYPE.MOVIE;
    if (anime.type === 'serial') anime.media = ANIME_MEDIA_TYPE.TV;
    if (anime.type === 'special') anime.media = ANIME_MEDIA_TYPE.SPECIAL;

    //* Mapper anime.genres
    anime.genresNew = [];

    anime.genres.forEach(code => {
      const slug = createSlug(code);
      const genre = ANIME_GENRES[slug] as AnimeGenre;

      if (genre) anime.genresNew.push(genre.slug);
    });

    await anime.save();
  }

  Logger.info(`[ModelPatcher]: Patching title model ended within ${((getUTC().timestamp - startStamp) / 1000).toFixed(2)}s`);
}



export async function loadTitles() {
  // const startedAt = getUTC().timestamp;
  // const titles = JSON.parse(fs.readFileSync(`${path.resolve()}/src/load-titles.json`).toString()).titles as Anime[];

  // stampDB('LoadTitles', titles);
  // Logger.info('Start loading titles from the file...');

  // for (const key in titles) {
  //   const title = titles[key];
  //   const { ageRate, country, description, genres, id, names, poster, season, status, studios, type, year } = title;

  //   await TitleService.create({
  //     ageRate,
  //     country,
  //     description: description,
  //     details: title.details ?? undefined,
  //     episodesCount: title.episodesCount ?? undefined,
  //     genres,
  //     id,
  //     names,
  //     season,
  //     status,
  //     studios,
  //     type,
  //     year,
  //     mal_id: title.mal_id ?? undefined,
  //     poster,
  //   });
  // }

  // Logger.info(`Ended loading titles from file within ${((getUTC().timestamp - startedAt) / 1000).toFixed(2)} with pushed ${titles.length} titles`);
}




function stampDB(model: string, documents: HydratedDocument<any>) {
  const dumpDir = `${path.resolve()}/.dump`;
  const dumpFile = `${dumpDir}/${model}-${getUTC().fulldate}-${getUTC().timeAccurate.replaceAll(':', '.')}.json`;

  if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir);
  fs.writeFileSync(dumpFile, JSON.stringify(documents));

  Logger.info(`Documents (${documents.length}) in ${model} stored at ${dumpFile}`);
}