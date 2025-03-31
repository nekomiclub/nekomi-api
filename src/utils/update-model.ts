import Anime, { ANIME_GENRES, ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_SEASON, ANIME_STATUS, AnimeGenre } from '~/core/interfaces/AnimeIntf';
import AnimeModel from '~/core/models/AnimeModel';
import TitleModel from '~/core/models/TitleModel';
import UserModel from '~/models/User';
import createSlug from './create-slug';
import fs from 'fs';
import getUTC from './get-utc';
import path from 'path';
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



export const ANIME_MODEL_UPDATE = new UpdateModel('TitleModel', async () => {
  //! ====================== CREATE DUMP
  const documents = await TitleModel.find();
  UpdateModel.dumpModel('TitleModel', documents);
  //! ====================== CREATE DUMP

  let touched = 0;
  const titles = documents;

  //* =======================
  for (const key in titles) {
    const title = titles[key];

    const anime: Anime = {
      uuid: title.id,
      broadcast: null,
      description: title.description,
      details: title.details,
      episodes: title.episodes,
      episodesCount: title.episodesCount,
      episodesMeta: title.episodesMeta,
      genres: [],
      malId: title.mal_id !== null ? +title.mal_id : null,
      malSyncedAt: 0,
      media: ANIME_MEDIA_TYPE.UNKNOWN,
      names: title.names,
      pictures: [],
      poster: title.poster,
      posterAdapt: null,
      rate: ANIME_RATE.G,
      related: [],
      score: {
        imdb: title.rating.IMDB,
        mal: title.rating.mal,
        malScoredBy: title.rating.mal_poll
      },
      season: ANIME_SEASON.FALL,
      slug: title.code,
      status: ANIME_STATUS.CURRENTLY_AIRING,
      studios: [],
      updatedAt: title.updatedAt,
      year: title.year,
      stopSync: {
        mal: false
      },
      createdAt: 0
    };

    //* Mapper anime.genres
    title.genres.forEach(code => {
      const slug = createSlug(code);
      const genre = ANIME_GENRES[slug] as AnimeGenre;

      if (genre) anime.genres.push(genre.slug);
    });

    //* Mapper anime.studios
    anime.studios = title.studios.map(el => { return { malId: -1, name: el }; });

    //* Mapper anime.ageRate
    if (title.ageRate === 'G') anime.rate = ANIME_RATE.G;
    if (title.ageRate === 'PG') anime.rate = ANIME_RATE.PG;
    if (title.ageRate === 'PG-13') anime.rate = ANIME_RATE.PG13;
    if (title.ageRate === 'R-17') anime.rate = ANIME_RATE.R17;
    if (title.ageRate === 'R+') anime.rate = ANIME_RATE.RPLUS;
    if (title.ageRate === 'Rx') anime.rate = ANIME_RATE.RX;

    //* Mappper anime.status
    if (title.status === 'announcement') anime.status = ANIME_STATUS.NOT_YET_AIRED;
    if (title.status === 'delayed') anime.status = ANIME_STATUS.CURRENTLY_AIRING;
    if (title.status === 'ongoing') anime.status = ANIME_STATUS.CURRENTLY_AIRING;
    if (title.status === 'out') anime.status = ANIME_STATUS.FINISHED_AIRING;

    //* Mapper anime.season
    if (title.season === 'autumn') anime.season = ANIME_SEASON.FALL;
    if (title.season === 'spring') anime.season = ANIME_SEASON.SPRING;
    if (title.season === 'summer') anime.season = ANIME_SEASON.SUMMER;
    if (title.season === 'winter') anime.season = ANIME_SEASON.WINTER;

    //* Mapper anime.type
    if (title.type === 'ONA') anime.media = ANIME_MEDIA_TYPE.ONA;
    if (title.type === 'OVA') anime.media = ANIME_MEDIA_TYPE.OVA;
    if (title.type === 'film') anime.media = ANIME_MEDIA_TYPE.MOVIE;
    if (title.type === 'serial') anime.media = ANIME_MEDIA_TYPE.TV;
    if (title.type === 'special') anime.media = ANIME_MEDIA_TYPE.SPECIAL;

    const doc = new AnimeModel(anime);
    await doc.save();

    Logger.info(`[UpdateModel]: TitleModel document migrated in AnimeModel. [uuid: ${anime.uuid}]`);

    touched += 1;
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