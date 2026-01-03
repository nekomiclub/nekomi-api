import Logger from '~/service/LoggerService';
import UserModelOld from '~/repo/old/UserModel';
import fs from 'fs';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { getUTC } from './utils';



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



export async function MUsersCreatedAt() {
  if (checkMigrationStatus('MUsersCreatedAt')) return;

  try {
    const oldUsers = await UserModelOld.find();

    for (const key in oldUsers) {
      const oldUser = oldUsers[key];

      try {
        const repo = new UserRepositoryClass();
        await repo.init(oldUser.id);

        repo._setCreatedAt(getUTC(oldUser.statistics.accountCreated).ISO);

        await repo.save();
      } catch (e) {
        Logger.error(`[MUsersCreatedAt]: Cannot migrate user "${oldUser.id}" created at`, e);
      }
    }

    finishMigration('MUsersCreatedAt');
  } catch (e) {
    Logger.error(`[MUsersCreatedAt]: Cannot migrate users created at`, e);
  }
}