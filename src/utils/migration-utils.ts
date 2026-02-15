import AdminDubberMapRepositoryClass from '~/repo/admin/AdminDubberMapRepository';
import AnimePlayerUpdateCrawler from '~/algorithms/AnimePlayerUpdateCrawler';
import AnimeRepository, { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import Logger from '~/service/LoggerService';
import fs from 'fs';
import ms from 'ms';
import path from 'path';
import { IAdminDubberMapData } from '~/intf/IAdmin';
import { NekoError } from '~/service/ExceptionService';
import { getContentSeason } from '~/algorithms/AnimeUpdateCrawler';
import { sleep } from './utils';



const MIGRATION_CACHE_PATH = './.cache/migration.json';



/** Check wether something migrated or not */
function checkMigrationStatus(slug: string) {
  if (!fs.existsSync(MIGRATION_CACHE_PATH)) {
    fs.mkdirSync(path.dirname(MIGRATION_CACHE_PATH), { recursive: true });
    fs.writeFileSync(MIGRATION_CACHE_PATH, JSON.stringify({}, null, 2));
  }

  const status = JSON.parse(fs.readFileSync(MIGRATION_CACHE_PATH).toString()) as Record<string, boolean>;

  return status[slug];
}



/** Finish migration of something */
function finishMigration(slug: string) {
  if (!fs.existsSync(MIGRATION_CACHE_PATH)) fs.writeFileSync(MIGRATION_CACHE_PATH, JSON.stringify({}, null, 2));

  const status = JSON.parse(fs.readFileSync(MIGRATION_CACHE_PATH).toString()) as Record<string, boolean>;
  status[slug] = true;

  fs.writeFileSync(MIGRATION_CACHE_PATH, JSON.stringify(status, null, 2));

  Logger.info(`[${slug}]: Migration finished`);
}



export async function MAnimeDocument() {
  const slug = 'MAnimeDocument';
  if (checkMigrationStatus(slug)) return;

  try {
    const documents = await AnimeRepository.getMany();

    for (const key in documents) {
      const document = documents[key];

      const repo = new AnimeRepositoryClass();
      await repo.init({ id: document.id });

      // @ts-expect-error Removed field will be undefined
      repo._set('episodes', undefined);
      // @ts-expect-error Removed field will be undefined
      repo._set('hikka_sync', undefined);
      // @ts-expect-error Removed field will be undefined
      repo._set('myanimelist_sync', undefined);

      repo._set('about_synced_at', repo.document.about_synced_at ?? null);
      repo._set('episodes_synced_at', repo.document.episodes_synced_at ?? null);

      const synonyms = [...repo.document.title_synonims, repo.document.title_en, repo.document.title_ja].filter(el => el !== null) as string[];
      repo._set('content_season', getContentSeason(synonyms));

      repo._set('player', repo.document.player ?? {
        dubbed: [],
        subbed: []
      });

      await repo.save();
    }

    finishMigration(slug);
  } catch (e) {
    Logger.error(`[${slug}]: Cannot update anime documents`, e);
  }
}



export async function MAdminDubbersMap() {
  const slug = 'MAdminDubbersMap';
  if (checkMigrationStatus(slug)) return;

  try {
    const path = './.cache/dubbers-map.jsonc';
    if (!fs.existsSync(path)) throw new NekoError('sys:not_found', `[${slug}]: Required file is not found at "${path}", skipping...`);

    const db = JSON.parse(fs.readFileSync(path).toString()) as IAdminDubberMapData[];

    const dubberMapRepo = new AdminDubberMapRepositoryClass();
    await dubberMapRepo.create();

    dubberMapRepo.setDubbers(db);

    await dubberMapRepo.save();

    finishMigration(slug);
  } catch (e) {
    Logger.error(`[${slug}]: Cannot migrate admin database`, e);
  }
}



export async function MAnimePlayer() {
  const slug = 'MAnimePlayer';
  if (checkMigrationStatus(slug)) return;

  try {
    const documents = await AnimeRepository.getMany({
      $or: [
        { mal_id: { $ne: null } },
        { imdb_id: { $ne: null } },
        { episodes_synced_at: null },
        { episodes_synced_at: { $lt: '2026-01-21T14:44:07.254Z' } }
      ],
    });

    await AnimePlayerUpdateCrawler.updateDubbersMap();

    for (const key in documents) {
      const document = documents[key];

      await AnimePlayerUpdateCrawler.syncAnimePlayer(document.id);

      await sleep(ms('2 sec'));
    }

    finishMigration(slug);
  } catch (e) {
    Logger.error(`[${slug}]: Cannot update players data`, e);
  }
}