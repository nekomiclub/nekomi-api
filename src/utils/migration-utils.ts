import Logger from '~/service/LoggerService';
import createSlug from './create-slug';
import fs from 'fs';
import { ANIME_RATING, ANIME_SEASON, ANIME_STATUS, ANIME_TYPE } from '~/intf/IAnime';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { CSRFAgentRepositoryClass } from '~/repo/CSRFAgentRepository';
import { ErrorConstructor } from '~/service/ExceptionService';
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



export async function MLoadCatalog() {
  try {
    const PATH = './.cache/catalog.json';
    if (!fs.existsSync(PATH)) throw new ErrorConstructor(`lc:file_not_exist', 'Catalog file is not exist at "${PATH}"`);

    const catalog = JSON.parse(fs.readFileSync(PATH).toString()) as IHikkaAnime[];

    catalog.slice(0, 100).forEach(async item => {
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
}

export async function MLoadAgents() {
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
}