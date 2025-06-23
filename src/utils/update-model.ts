import AnimeModel from '~/core/models/AnimeModel';
import UserModel from '~/core/models/UserModel';
import fs from 'fs';
import path from 'path';
import { HydratedDocument } from 'mongoose';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';
import { getUTC } from './utils';



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
  const documents = await AnimeModel.find();
  UpdateModel.dumpModel('AnimeModel', documents);
  //! ====================== CREATE DUMP

  let touched = 0;
  const animes = documents;

  //* =======================
  for (const key in animes) {
    const anime = animes[key];

    anime.createdAt = anime.createdAt ?? getUTC().timestamp;

    anime.shikimoriSyncedAt = anime.shikimoriSyncedAt ?? null;
    anime.hikkaSyncedAt = anime.hikkaSyncedAt ?? null;
    anime.anidbSyncedAt = anime.anidbSyncedAt ?? null;

    anime.stopSync.mal = anime.stopSync.mal ?? false;
    anime.stopSync.shikimori = anime.stopSync.shikimori ?? false;
    anime.stopSync.anidb = anime.stopSync.anidb ?? false;
    anime.stopSync.hikka = anime.stopSync.hikka ?? false;

    anime.markModified('stopSync');

    await anime.save();

    touched += 1;
  }
  //* =======================

  Logger.info(`[UpdateModel]: Anime model successfully updated`);
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

    user.set('togetherRooms', undefined, { strict: false });

    await user.save();
  }
  //* =======================

  return touched;
});