import AdminDubberMapRepositoryClass from '~/repo/admin/AdminDubberMapRepository';
import AnimeRepository, { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import Logger from '~/service/LoggerService';
import fs from 'fs';
import { IAdminDubberMapData } from '~/intf/IAdmin';
import { NekoError } from '~/service/ExceptionService';



const MIGRATION_CACHE_PATH = './.cache/migration.json';



/** Check wether something migrated or not */
function checkMigrationStatus(slug: string) {
  if (!fs.existsSync(MIGRATION_CACHE_PATH)) fs.writeFileSync(MIGRATION_CACHE_PATH, JSON.stringify({}, null, 2));

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



export async function MAnimePlayer() {
  const slug = 'MAnimePlayer';
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

      repo._set('about_synced_at', null);
      repo._set('episodes_synced_at', null);
      repo._set('content_season', null);

      repo._set('player', {
        dubbed: [],
        subbed: []
      });

      await repo.save();
    }

    finishMigration(slug);
  } catch (e) {
    Logger.error(`[${slug}]: Cannot migrate anime player`, e);
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