import AdminDubberMapRepositoryClass from '~/repo/admin/AdminDubberMapRepository';
import Logger from '~/service/LoggerService';
import fs from 'fs';



const MIGRATION_CACHE_PATH = './.cache/migration.json';

function checkMigrationStatus(key: string) {
  if (!fs.existsSync(MIGRATION_CACHE_PATH)) fs.writeFileSync(MIGRATION_CACHE_PATH, JSON.stringify({}, null, 2));

  const status = JSON.parse(fs.readFileSync(MIGRATION_CACHE_PATH).toString()) as Record<string, boolean>;

  return status[key];
}

function finishMigration(key: string) {
  if (!fs.existsSync(MIGRATION_CACHE_PATH)) fs.writeFileSync(MIGRATION_CACHE_PATH, JSON.stringify({}, null, 2));

  const status = JSON.parse(fs.readFileSync(MIGRATION_CACHE_PATH).toString()) as Record<string, boolean>;
  status[key] = true;

  fs.writeFileSync(MIGRATION_CACHE_PATH, JSON.stringify(status, null, 2));
}



export async function MAdminDubbersMap() {
  const slug = 'MAdmin';
  if (checkMigrationStatus(slug)) return;

  try {
    const db = JSON.parse(fs.readFileSync('./.cache/dubbers-synonimized.jsonc').toString()) as Record<string, string[]>;

    const dubberMapRepo = new AdminDubberMapRepositoryClass();
    await dubberMapRepo.create();

    for (const key in db) {
      const values = db[key];

      dubberMapRepo.setDubberSynonyms(key, values);
    }

    await dubberMapRepo.save();

    finishMigration(slug);
  } catch (e) {
    Logger.error(`[${slug}]: Cannot migrate admin database`, e);
  }
}