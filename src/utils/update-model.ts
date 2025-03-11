import TitleModel from '~/models/Title';
import UserModel from '~/models/User';
import createSlug from './create-slug';
import fs from 'fs';
import getUTC from './get-utc';
import path from 'path';
import { ANIME_GENRES, ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, AnimeGenre } from '~/core/interfaces/AnimeIntf';
import { HydratedDocument } from 'mongoose';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



const DUMP_DIR_PATH = `${path.resolve()}/.dump`;
const DATA_FILE_PATH = `${DUMP_DIR_PATH}/data.json`;

interface DATA_FILE_DUMP {
  name: string
  at: string
  commit: string
}

interface DATA_FILE {
  dumped: DATA_FILE_DUMP[]
}



class UpdateModel {
  constructor(
    private name: string,
    /** @returns touched documents */
    private callback: () => Promise<number> | number,
  ) { }

  async run() {
    if (!this.canDump()) return Logger.fail(`[UpdateModel]: Model ${this.name} updating aborted`);

    const start = getUTC().timestamp;

    Logger.info(`[UpdateModel]: Updating ${this.name} model...`);

    const touched = await this.callback();

    Logger.info(`[UpdateModel]: Model ${this.name} updated. [within: ${((getUTC().timestamp - start) / 1000).toFixed(2)}s; touched: ${touched}]`);
  }

  canDump(): boolean {
    let canDump = false;

    if (fs.existsSync(DATA_FILE_PATH)) {
      const { dumped } = JSON.parse(fs.readFileSync(DATA_FILE_PATH).toString()) as DATA_FILE;

      if (!dumped.some(el => el.name === this.name && el.commit === config.commit)) {
        canDump = true;

        dumped.push({
          at: `${getUTC().fulldate} ${getUTC().timeAccurate}`,
          commit: config.commit,
          name: this.name
        });

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify({ dumped }, null, 2));
      }
    } else {
      // File is not found, pass
      canDump = true;

      const payload: DATA_FILE = {
        dumped: [{
          at: `${getUTC().fulldate} ${getUTC().timeAccurate}`,
          commit: config.commit,
          name: this.name
        }]
      };

      fs.rmSync(DATA_FILE_PATH, { recursive: true, force: true });
      fs.mkdirSync(DUMP_DIR_PATH, { recursive: true });
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(payload, null, 2));
    }

    return canDump;
  }

  static dumpModel(name: string, documents: HydratedDocument<any>[]) {
    const dumpFile = `${DUMP_DIR_PATH}/${name}-${getUTC().fulldate}-${getUTC().timeAccurate.replaceAll(':', '.')}.json`;

    if (!fs.existsSync(DUMP_DIR_PATH)) fs.mkdirSync(DUMP_DIR_PATH, { recursive: true });
    fs.writeFileSync(dumpFile, JSON.stringify(documents));

    Logger.info(`[UpdateModel]: Documents (${documents.length}) in ${name} stored at ${dumpFile}`);
  }
}



// export const MODEL_NAME = new UpdateModel('MODEL_NAME', async () => {
//   //! ====================== CREATE DUMP
//   const documents = await MODEL_NAME.find();
//   UpdateModel.dumpModel('MODEL_NAME', documents);
//   //! ====================== CREATE DUMP

//   let touched = 0;

//   //* =======================
//   for (const doc in documents) {
//     const doc = documents[key];

//     await doc.save();
//   }
//   //* =======================

//   return touched;
// });



export const ANIME_MODEL_UPDATE = new UpdateModel('AnimeModel', async () => {
  //! ====================== CREATE DUMP
  const documents = await TitleModel.find();
  UpdateModel.dumpModel('AnimeModel', documents);
  //! ====================== CREATE DUMP

  let touched = 0;
  const titles = documents;

  //* =======================
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
    anime.posterAdapt = anime.posterAdapt ?? null;

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

    touched += 1;
    await anime.save();
  }
  //* =======================

  return touched;
});

export const USER_MODEL_UPDATE = new UpdateModel('UserModel', async () => {
  //! ====================== CREATE DUMP
  const documents = await UserModel.find();
  UpdateModel.dumpModel('UserModel', documents);
  //! ====================== CREATE DUMP

  let touched = 0;
  const users = documents;

  //* =======================
  for (const key in users) {
    const user = users[key];

    user.statistics.dubberTeamMember = user.statistics.dubber_team_member;

    user.markModified('statistics');

    await user.save();
  }
  //* =======================

  return touched;
});