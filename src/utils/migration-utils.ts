import Logger from '~/services/LoggerService.js';
import conf from '~/conf.js';
import fs from 'fs';
import path from 'path';



const MIGRATION_CACHE_PATH = `${conf.vars.volumes.logs}/migration.json`;



/** Check whether something migrated or not */
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


    finishMigration(slug);
  } catch (e) {
    Logger.error(`[${slug}]: Cannot update anime documents`, e);
  }
}



export async function MAdminDubbersMap() {
  const slug = 'MAdminDubbersMap';
  if (checkMigrationStatus(slug)) return;

  try {


    finishMigration(slug);
  } catch (e) {
    Logger.error(`[${slug}]: Cannot migrate admin database`, e);
  }
}



export async function MAnimePlayer() {
  const slug = 'MAnimePlayer';
  if (checkMigrationStatus(slug)) return;

  try {


    finishMigration(slug);
  } catch (e) {
    Logger.error(`[${slug}]: Cannot update players data`, e);
  }
}