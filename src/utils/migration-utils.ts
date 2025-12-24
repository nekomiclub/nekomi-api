import DubberModel from '~/repo/old/DubberModel';
import Logger from '~/service/LoggerService';
import createSlug from './create-slug';
import fs from 'fs';
import { ANIME_RATING, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE } from '~/intf/IAnime';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { CSRFAgentRepositoryClass } from '~/repo/CSRFAgentRepository';
import { DubberRepositoryClass } from '~/repo/DubberRepository';
import { ErrorConstructor } from '~/service/ExceptionService';
import { ROLE_PERMISSION } from '~/intf/IRole';
import { RoleRepositoryClass } from '~/repo/RoleRepository';
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

    catalog.forEach(async item => {
      try {
        const as = new AnimeRepositoryClass();
        if (await as.safeGetOne(createSlug(item.title_en))) return Logger.verbose(`[MLoadCatalog]: Item ${item.slug} skipped due to it's existance in the db`);

        await as.create();

        await as.setTitle({ title_ja: item.title_ja, title_en: item.title_en, title_ua: item.title_ua });
        await as.setHikkaSlug(item.slug);

        as.setScore({ score: item.score, scoredBy: item.scored_by });
        as.setYear(item.year);
        as.setEpisodesTotal(item.episodes_total);
        as.setEpisodesReleased(item.episodes_released);

        as.setType(as.parseStringToType(item.media_type, ANIME_TYPE));
        as.setStatus(as.parseStringToType(item.status, ANIME_STATUS));
        as.setSeason(as.parseStringToType(item.season, ANIME_SEASON));
        as.setRating(as.parseStringToType(item.rating, ANIME_RATING));

        await as.save();

        Logger.info(`[MLoadCatalog]: Item loaded [id: ${as.document?.id}]`);
      } catch (e) {
        Logger.error(`[MLoadCatalog]: Error parsing item ${item.slug}`, e);
      }
    });
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
        repo._setSlug(dubber.slug!);
        repo.setAvatar(dubber.avatar!);
        repo.setCover(dubber.banner!);
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