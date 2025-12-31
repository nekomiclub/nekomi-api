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