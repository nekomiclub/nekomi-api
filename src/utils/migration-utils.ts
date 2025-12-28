import AnimeModel from '~/repo/old/AnimeModel';
import DubberModel from '~/repo/old/DubberModel';
import IUS_User, { IUS_USER_RESTRICTION } from '~/intf/IUser-userapi';
import Logger from '~/service/LoggerService';
import UserModel from '~/repo/old/UserModel';
import axios from 'axios';
import conf from '~/config';
import createSlug from './create-slug';
import fs from 'fs';
import { ANIME_RATING, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE } from '~/intf/IAnime';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { CSRFAgentRepositoryClass } from '~/repo/CSRFAgentRepository';
import { DubberRepositoryClass } from '~/repo/DubberRepository';
import { ErrorConstructor } from '~/service/ExceptionService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { RoleRepositoryClass } from '~/repo/RoleRepository';
import { USER_RESTRICTION } from '~/intf/IUser';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { getUTC } from './utils';



interface IHikkaAnime {
  data_type: string
  media_type: string
  title_ua: string
  title_en: string
  title_ja: string
  episodes_released: number
  episodes_total: number
  image: string
  status: string
  native_scored_by: number
  native_score: number
  scored_by: number
  score: number
  slug: string
  start_date: number
  end_date: number
  translated_ua: boolean
  season: string
  source: string
  rating: string
  year: number
  watch: any[]
}

interface IAgent {
  id: string
  origin: string
  createdAt: number
  publicKey: string
}



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



export async function MLoadCatalog() {
  if (checkMigrationStatus('MLoadCatalog')) return Logger.debug(`[MLoadCatalog]: Skipping due to it's finish`);

  try {
    const PATH = './.cache/catalog.json';
    if (!fs.existsSync(PATH)) throw new ErrorConstructor(`lc:file_not_exist', 'Catalog file is not exist at "${PATH}"`);

    const catalog = JSON.parse(fs.readFileSync(PATH).toString()) as IHikkaAnime[];

    for (const key in catalog) {
      const item = catalog[key];

      try {
        const slug = createSlug(item.title_en);

        const repo = new AnimeRepositoryClass();
        if (await repo.safeGetOne(slug)) return Logger.verbose(`[MLoadCatalog]: Item ${item.slug} skipped due to it's existance in the db`);

        const nekoAnime = await AnimeModel.findOne({ slug });

        await repo.create();

        await repo.setTitle({ title_ja: item.title_ja, title_en: item.title_en, title_ua: item.title_ua });
        await repo.setHikkaSlug(item.slug);

        // Set prev id retrieved by slug
        if (nekoAnime) repo._implicitSetId(nekoAnime.uuid);

        repo.setScore({ score: item.score, scoredBy: item.scored_by });
        repo.setYear(item.year);
        repo.setEpisodesTotal(item.episodes_total);
        repo.setEpisodesReleased(item.episodes_released);

        repo.setType(repo.parseStringToType(item.media_type, ANIME_TYPE));
        repo.setStatus(repo.parseStringToType(item.status, ANIME_STATUS));
        repo.setSeason(repo.parseStringToType(item.season, ANIME_SEASON));
        repo.setRating(repo.parseStringToType(item.rating, ANIME_RATING));

        await repo.save();

        Logger.info(`[MLoadCatalog]: Item loaded [id: ${repo.document?.id}]`);
      } catch (e) {
        Logger.error(`[MLoadCatalog]: Error parsing item ${item.slug}`, e);
      }
    }


  } catch (e) {
    Logger.error(`[MLoadCatalog]: An error occured while loading catalog`, e);
  }

  finishMigration('MLoadCatalog');
  Logger.info(`[MLoadCatalog]: Catalog loaded`);
}



export async function MLoadAgents() {
  if (checkMigrationStatus('MLoadAgents')) return Logger.debug(`[MLoadAgents]: Skipping due to it's finish`);

  try {
    const PATH = './.cache/agents.json';
    if (!fs.existsSync(PATH)) throw new ErrorConstructor(`lc:file_not_exist', 'Agents file is not exist at "${PATH}"`);

    const agents = JSON.parse(fs.readFileSync(PATH).toString()) as IAgent[];

    for (const key in agents) {
      const agent = agents[key];

      try {
        await new CSRFAgentRepositoryClass().create({ origin: agent.origin, _implicitSetCreatedAt: getUTC(agent.createdAt).ISO, _implicitSetPKI: agent.publicKey });
      } catch (e) {
        Logger.error(`[MLoadAgents]: An error occured while loading agent ${agent.origin}`, e);
      }
    }
  } catch (e) {
    Logger.error(`[MLoadAgents]: An error occured while loading agents`, e);
  }

  finishMigration('MLoadAgents');
  Logger.info(`[MLoadAgents]: Agents loaded`);
}



export async function MLoadRoles() {
  if (checkMigrationStatus('MLoadRoles')) return Logger.debug(`[MLoadRoles]: Skipping due to it's finish`);

  try {
    await new RoleRepositoryClass().create({ name: 'Користувач', slug: 'user' });

    const rootRole = new RoleRepositoryClass();
    await rootRole.create({ name: 'Користувач', slug: 'root' });
    rootRole.appendPermission(ROLE_PERMISSION.ABSOLUTE);

    await rootRole.save();
  } catch (e) {
    Logger.error(`[MLoadRoles]: An error occured while loading agents`, e);
  }

  finishMigration('MLoadRoles');
  Logger.info(`[MLoadRoles]: Roles loaded`);
}



export async function MLoadDubbers() {
  if (checkMigrationStatus('MLoadDubbers')) return Logger.debug(`[MLoadDubbers]: Skipping due to it's finish`);

  try {
    const dubbers = await DubberModel.find();

    for (const key in dubbers) {
      const dubber = dubbers[key];

      try {
        const repo = new DubberRepositoryClass();

        await repo.create({ _implicitId: dubber.id, _implicitCreatedAt: getUTC(dubber.statistics.createdAt!).ISO });

        await repo.setName(dubber.nameUkr!);
        await repo._setSlug(dubber.slug!);
        repo.setAbout(dubber.description!);

        repo._setMembers(dubber.members.map(el => {
          return {
            id: el.id,
            role: el.role,
            member_since: getUTC(el.memberSince).ISO
          };
        }));

        if (dubber.socials?.telegram) repo.setSocial('telegram', dubber.socials!.telegram!);
        if (dubber.socials?.instagram) repo.setSocial('instagram', dubber.socials!.instagram!);
        if (dubber.socials?.youtube) repo.setSocial('youtube', dubber.socials!.youtube!);
        if (dubber.socials?.tiktok) repo.setSocial('tiktok', dubber.socials!.tiktok!);

        if (dubber.support?.diaka) repo.setSupport('diaka', dubber.support!.diaka!);
        if (dubber.support?.monobank) repo.setSupport('monobank', dubber.support!.monobank!);
        if (dubber.support?.bymeacoffee) repo.setSupport('bymeacoffee', dubber.support!.bymeacoffee!);
        if (dubber.support?.patreon) repo.setSupport('patreon', dubber.support!.patreon!);

        // Upload avatar
        try {
          if (dubber.avatar !== conf.vars.defaultAvatar) {
            const res = await axios.get(dubber.avatar!, { responseType: 'arraybuffer' });

            await repo.uploadAvatar(res.data, conf.vars.INTERNAL_ID);
          }
        } catch (e) {
          Logger.error(`[MLoadDubbers]: Cannot load avatar for dubber "${dubber.id}"`);
        }

        // Upload cover
        try {
          if (dubber.banner !== conf.vars.defaultCover) {
            const res = await axios.get(dubber.banner!, { responseType: 'arraybuffer' });

            await repo.uploadCover(res.data, conf.vars.INTERNAL_ID);
          }
        } catch (e) {
          Logger.error(`[MLoadDubbers]: Cannot load avatar for dubber "${dubber.id}"`);
        }

        await repo.save();
      } catch (e) {
        Logger.error(`[MLoadDubbers]: An error occured while loading dubber ${dubber.id}`, e);
      }
    }
  } catch (e) {
    Logger.error(`[MLoadDubbers]: An error occured while loading dubbers`, e);
  }

  finishMigration('MLoadDubbers');
  Logger.info(`[MLoadDubbers]: Dubbers loaded`);
}



export async function MLoadUsers() {
  if (checkMigrationStatus('MLoadUsers')) return Logger.debug(`[MLoadUsers]: Skipping due to it's finish`);

  try {
    const PATH = './.cache/users.json';
    if (!fs.existsSync(PATH)) throw new ErrorConstructor(`lc:file_not_exist', 'Users file is not exist at "${PATH}"`);

    const users = JSON.parse(fs.readFileSync(PATH).toString()) as IUS_User[];

    for (const key in users) {
      const user = users[key];

      const nekoUser = await UserModel.findOne({ id: user.id });

      const repo = new UserRepositoryClass();

      await repo.create({ _implicitId: user.id, _implicitCreatedAt: getUTC(user.statistics.createdAt).ISO });

      await repo.setUsername(user.username);
      await repo.setEmail(user.email);

      // Map user restrictions
      user.restrictions.forEach(el => {
        if (el === IUS_USER_RESTRICTION.BANNED) repo.appendRestriction(USER_RESTRICTION.BANNED);
        if (el === IUS_USER_RESTRICTION.UPLOAD_AVATAR) repo.appendRestriction(USER_RESTRICTION.UPLOAD_AVATAR);
        if (el === IUS_USER_RESTRICTION.USERNAME_CHANGE) repo.appendRestriction(USER_RESTRICTION.USERNAME_CHANGE);
      });

      // Upload avatar
      try {
        if (user.avatarURL !== conf.vars.defaultAvatar) {
          const res = await axios.get(user.avatarURL!, { responseType: 'arraybuffer' });

          await repo.uploadAvatar(res.data);
        }
      } catch (e) {
        Logger.error(`[MLoadUsers]: Cannot load avatar for user "${user.id}"`, e);
      }

      if (nekoUser) {
        if (nekoUser.roles.includes('root')) await repo.grantRole('root');

        repo._setTotalViewtime(nekoUser.statistics.viewtime);
        repo.setDubberTeamMember(nekoUser.statistics.dubber_team_member);
        repo._setSubscriptions(nekoUser.subscribes);

        if (nekoUser.telegramData?.id) repo.setTelegramId(nekoUser.telegramData.id);

        // Map watch progress
        nekoUser.watchProgress.forEach(el => {
          repo.setViewProgress({
            anime_id: el.titleID,
            dubber_id: el.dubberID,
            episode: el.episodeOrder,
            progress: el.progress,
          });
        });

        // Map libs
        for (const key in nekoUser.libs) {
          const nekoLib = nekoUser.libs[key];
          const lib = repo.document?.libs.find(el => el.type === nekoLib.type);
          if (!lib) {
            Logger.warn(`[MLoadUsers]: Cannot find user "${nekoLib.type}" lib`);
            continue;
          }

          for (const key in nekoLib.titles) {
            const id = nekoLib.titles[key];

            await repo.appendLibAnime(lib.id, id);
          }
        }

        // Upload cover
        try {
          if (nekoUser.banner !== conf.vars.defaultCover) {
            const res = await axios.get(nekoUser.banner!, { responseType: 'arraybuffer' });

            await repo.uploadCover(res.data);
          }
        } catch (e) {
          Logger.error(`[MLoadUsers]: Cannot load avatar for user "${user.id}"`, e);
        }
      } else {
        Logger.warn(`[MLoadUsers]: Cannot find nekomi user for user api id "${user.id}"`);
      }



      await repo.save();
    }
  } catch (e) {
    Logger.error(`[MLoadUsers]: An error occured while loading users`, e);
  }

  finishMigration('MLoadUsers');
  Logger.info(`[MLoadUsers]: Users loaded`);
}