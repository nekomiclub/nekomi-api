import AnimeRepository, { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import AnimeValidators from '~/utils/validators/anime-validators';
import Logger from '~/service/LoggerService';
import axios from 'axios';
import conf from '~/conf';
import fs from 'fs';
import ms from 'ms';
import { ANIME_GENRE, IAnimeEpisode, IAnimePosterNode, IAnimeRelation, IAnimeSchedule, IAnimeScreenshotNode, IAnimeStudio } from '~/intf/IAnime';
import { HikkaAPI } from '~/api/external/hikka.api';
import { IHikkaGenre, IHikkaScheduleItem } from '~/intf/external-api/IHikka.api';
import { IJikanAnimeEpisodeMeta, IJikanMalEntity, IJikanRelation } from '~/intf/external-api/IJikan.api';
import { ISODateString } from '~/intf/types';
import { IdsMoeAPI } from '~/api/external/idsmoe.api';
import { JikanAPI } from '~/api/external/jikan.api';
import { ShikimoriAPI } from '~/api/external/shikimori.api';
import { buffer2hash, endWithin, getUTC } from '~/utils/utils';



interface ICache<T> {
  updated_at: ISODateString
  data: T
}

interface IAnimeListCacheItem {
  mal_id?: number
  imdb_id?: string
}

interface IUAPoster {
  url: string
  author: string
}

interface IUAPostersCacheItem {
  hikka_url: string // can be empty
  posters: IUAPoster[]
}

type AnimeListsCacheType = ICache<IAnimeListCacheItem[]>;
type UAPostersCacheType = ICache<IUAPostersCacheItem[]>;



let cacheAwaitI = 0;
let isCacheRevalidated = false;
let UPDATE_YEAR = getUTC().year + 1;
let ANIME_LISTS_CACHE: IAnimeListCacheItem[] | null = null;
let UAPOSTERS_CACHE: IUAPostersCacheItem[] | null = null;



const CACHE_FOLDER = `./.cache`;
const ANIME_LISTS_CACHE_PATH = `${CACHE_FOLDER}/bulk-ids.json`;
const UAPOSTERS_CACHE_PATH = `${CACHE_FOLDER}/bulk-posters.json`;
const CACHE_REVALIDATION_TIMEOUT_MS = ms('3day');



const UAPOSTERS_AUTHOR_MAP = {
  'Візуали': '48a9b773-32c0-4c6f-b522-e5d6a0aa66a2',
  'uaposters': '442b01b5-1387-4486-90dc-efee5049ef2c',
  'Олехандро': '9f5e809e-1816-41f8-98db-6b07e7b6851d',
  'Лунсар': '7fb630e1-d6a8-456a-866a-796c299cdb89',
};



// Get cache
async function getCache() {
  if (isCacheRevalidated) return;

  // Ensure that cache folder exists
  if (!fs.existsSync(CACHE_FOLDER)) fs.mkdirSync(CACHE_FOLDER);

  if (!fs.existsSync(ANIME_LISTS_CACHE_PATH)) fs.writeFileSync(ANIME_LISTS_CACHE_PATH, JSON.stringify({ updated_at: getUTC(0).ISO, data: [] } as ICache<any>, null, 2));
  if (!fs.existsSync(UAPOSTERS_CACHE_PATH)) fs.writeFileSync(UAPOSTERS_CACHE_PATH, JSON.stringify({ updated_at: getUTC(0).ISO, data: [] } as ICache<any>, null, 2));

  const alc = JSON.parse(fs.readFileSync(ANIME_LISTS_CACHE_PATH).toString()) as AnimeListsCacheType;
  const upc = JSON.parse(fs.readFileSync(UAPOSTERS_CACHE_PATH).toString()) as UAPostersCacheType;



  // Revalidate anime lists cache 
  if (getUTC(alc.updated_at).timestamp < getUTC().timestamp - CACHE_REVALIDATION_TIMEOUT_MS) {
    try {
      const data = await axios.get('https://raw.githubusercontent.com/Fribb/anime-lists/refs/heads/master/anime-list-full.json');
      const cache: AnimeListsCacheType = {
        updated_at: getUTC().ISO,
        data: data.data
      };

      fs.writeFileSync(ANIME_LISTS_CACHE_PATH, JSON.stringify(cache, null, 2));

      ANIME_LISTS_CACHE = data.data;
      Logger.debug(`[AnimeBulkUpdate]: Cache for ALC revalidated`);
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: An error occured while updating cache for ALC`, e);
    }
  } else {
    ANIME_LISTS_CACHE = (JSON.parse(fs.readFileSync(ANIME_LISTS_CACHE_PATH).toString()) as AnimeListsCacheType).data;
  }



  // Revalidate uaposters cache 
  if (getUTC(upc.updated_at).timestamp < getUTC().timestamp - CACHE_REVALIDATION_TIMEOUT_MS) {
    try {
      const data = await axios.get('https://raw.githubusercontent.com/DrBryanMan/UAPosters/refs/heads/main/PostersList.json');
      const cache: UAPostersCacheType = {
        updated_at: getUTC().ISO,
        data: data.data
      };

      fs.writeFileSync(UAPOSTERS_CACHE_PATH, JSON.stringify(cache, null, 2));

      UAPOSTERS_CACHE = data.data;
      Logger.debug(`[AnimeBulkUpdate]: Cache for UPC revalidated`);
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: An error occured while updating cache for UPC`, e);
    }
  } else {
    UAPOSTERS_CACHE = (JSON.parse(fs.readFileSync(UAPOSTERS_CACHE_PATH).toString()) as UAPostersCacheType).data;
  }




  Logger.debug(`[AnimeBulkUpdate]: Cache updated!`);

  isCacheRevalidated = true;
}



const hikkaErrored: string[] = [];



/**
 * Anime bulk update algorithm
 * 
 * Steps:
 * 1. Find anime document without malId specified
 * 2. Pull anime document from hikka using hikka slug, retrieve malId & etc
 * 3. Pull anime document from myanimelist using malId, retrieve episodes meta, relations, temporary poster, etc
 * 4. Pull imdbId if not specified
 * 5. Pull uaposters & upload hero poster, if not set mal poster as hero
 * 6. Pull ashdi episodes
 */
export default async function AnimeBulkUpdate() {
  await getCache();
  await awaitCache();

  try {
    const startedAt = getUTC().timestamp;

    const document = await AnimeRepository.safeGetOne({ mal_id: null, hikka_slug: { $ne: null }, year: UPDATE_YEAR, id: { $nin: hikkaErrored } });
    if (!document) {
      if (UPDATE_YEAR > AnimeValidators.limits.MIN_YEAR) return UPDATE_YEAR -= 1;
      if (UPDATE_YEAR === AnimeValidators.limits.MIN_YEAR) return UPDATE_YEAR = getUTC().year + 1;

      return;
    }

    const repo = new AnimeRepositoryClass();
    await repo.init({ id: document.id });

    const hikkaSlug = repo.document!.hikka_slug!;
    let malId = -1;
    let fallbackPoster = conf.vars.defaultPoster;



    // * Pull hikka
    try {
      const hikkaRes = await HikkaAPI.getAnime(document.hikka_slug!);

      repo.setMalId(hikkaRes.mal_id);
      malId = hikkaRes.mal_id;

      await repo.setTitle({ title_en: hikkaRes.title_en, title_ja: hikkaRes.title_ja, title_ua: hikkaRes.title_ua, synonyms: hikkaRes.synonyms });
      if (hikkaRes.title_en) await repo.setSlug(hikkaRes.title_en);
      if (hikkaRes.title_ja && !hikkaRes.title_en) await repo.setSlug(hikkaRes.title_ja);

      repo.setSynopsis({ synopsis_en: hikkaRes.synopsis_en, synopsis_ua: hikkaRes.synopsis_ua });
      repo.setEpisodesReleased(hikkaRes.episodes_released);
      repo.setEpisodesTotal(hikkaRes.episodes_total);

      repo.setType(hikkaRes.media_type ? repo.parseType(hikkaRes.media_type) : null);
      repo.setStatus(hikkaRes.status ? repo.parseStatus(hikkaRes.status) : null);
      repo.setSeason(hikkaRes.season ? repo.parseSeason(hikkaRes.season) : null);
      repo.setRating(hikkaRes.rating ? repo.parseRating(hikkaRes.rating) : null);

      repo.setScore({ score: hikkaRes.score, scoredBy: hikkaRes.scored_by });
      repo.setYear(hikkaRes.year);

      // Parse genres
      const genres = parseHikkaGenres(hikkaRes.genres);
      if (genres.length) repo._setGenres(genres);

      // Parse schedule
      const schedule = parseHikkaSchedule(hikkaRes.schedule);
      if (schedule.length) repo._setSchedule(schedule);

      repo.setSync('about_synced_at', getUTC().ISO);

      if (hikkaRes.image) fallbackPoster = hikkaRes.image;
    } catch (e) {
      hikkaErrored.push(repo.document!.id);

      Logger.warn(`[AnimeBulkUpdate/Hikka]: Hikka parse error, total items: `, hikkaErrored);
      Logger.error(`[AnimeBulkUpdate]: Hikka update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull myanimelist (jikan)
    try {
      const jikanRes = await JikanAPI.getAnime(malId);

      // Parse studios
      const studios = parseJikanStudios(jikanRes.studios);
      if (studios.length) repo._setStudios(studios);

      // Parse relations
      const relations = parseJikanRelations(jikanRes.relations);
      if (relations.length) repo._setRelations(relations);

      const jikanEpsRes = await JikanAPI.getAnimeEpisodeMeta(malId);
      if (jikanEpsRes.length) repo._setEpisodesMeta(parseJikanEpisodes(jikanEpsRes));

      if (!fallbackPoster) fallbackPoster = jikanRes.images.webp.large_image_url ?? jikanRes.images.jpg.large_image_url;

      repo.setSync('about_synced_at', getUTC().ISO);
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: MyAnimeList (Jikan) update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull imdb
    try {
      if (!repo.document?.imdb_id) {
        let idsMoeId: string | null = null;

        try {
          const idsRes = await IdsMoeAPI.getIds(malId);

          idsMoeId = idsRes.imdb;
        } catch (e) { null; }

        const imdbId: string | undefined = idsMoeId ?? ANIME_LISTS_CACHE?.find(el => el.mal_id === malId)?.imdb_id;

        if (imdbId) await repo.setIMDBId(imdbId);
      }
    } catch (e) {
      Logger.warn(`[AnimeBulkUpdate]: IMDB update failed, skipping... [id: ${document.id}]`, e);
    }




    // * Pull uaposters
    try {
      const posters = UAPOSTERS_CACHE?.find(el => el.hikka_url?.includes(hikkaSlug))?.posters;

      if (posters?.length) {
        const postersOld = repo.document?.posters ?? [];
        const nodes: IAnimePosterNode[] = [];
        const authors: { authorId: string, hash: string }[] = [];



        for (const key in posters) {
          const poster = posters[key];
          const authorId: string | null = UAPOSTERS_AUTHOR_MAP[poster.author] ?? null; // TODO: Map author name to id

          const res = await axios.get(`https://drbryanman.github.io/UAPosters/${poster.url}`, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(res.data);
          const hash = buffer2hash(buffer);

          if (authorId) authors.push({ authorId, hash });

          // Skip upload if node exist
          const exist = postersOld.find(el => el.pull_hash === hash);
          if (exist) {
            nodes.push(exist);
            continue;
          }

          const node = await repo.uploadPoster(buffer, conf.vars.INTERNAL_ID, authorId, !authorId ? poster.author : undefined);

          nodes.push(node);
        }



        // Delete deprecated nodes
        const deprecatedNodes = postersOld.filter(el => !nodes.some(node => el.pull_hash === node.pull_hash));

        for (const key in deprecatedNodes) {
          const node = deprecatedNodes[key];

          await repo.removePoster(node.pull_hash, conf.vars.INTERNAL_ID);
        }



        // Define hero poster
        if (!nodes.some(el => el.is_hero)) {
          const uaposters = authors.find(el => el.authorId === UAPOSTERS_AUTHOR_MAP['uaposters']);
          let node: IAnimePosterNode | undefined;

          // Prioritize hero poster from uaposters
          if (uaposters) {
            node = nodes.find(el => el.pull_hash === uaposters.hash);
          }

          // Get node for first recognized author
          if (!node) node = nodes.find(el => el.pull_hash === authors[0]?.hash) ?? nodes[0];


          const author = authors.find(el => el.hash === node!.pull_hash);
          if (author) await repo.setHeroPosterAuthor(author.authorId);

          await repo.setIsPosterHero(node.pull_hash, true);
        }
      }
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: UAPosters update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull fallback poster
    try {
      if (repo.document?.posters.length === 1 && repo.document.posters[0].authorId === conf.vars.INTERNAL_ID && fallbackPoster) {
        const res = await axios.get(fallbackPoster, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        await repo.uploadPoster(buffer, conf.vars.INTERNAL_ID, null);
      }
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: Pull fallback poster failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull shikimori
    try {
      const shikimoriRes = await ShikimoriAPI.getAnime(malId);
      const screenshots = shikimoriRes.screenshots;

      if (screenshots?.length) {
        const screenshotsOld = repo.document?.screenshots ?? [];
        const nodes: IAnimeScreenshotNode[] = [];


        for (const key in screenshots) {
          const screenshot = screenshots[key];

          const res = await axios.get(`https://shikimori.one${screenshot.original}`, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(res.data);
          const hash = buffer2hash(buffer);

          // Skip upload if node exist
          const exist = screenshotsOld.find(el => el.pull_hash === hash);
          if (exist) {
            nodes.push(exist);
            continue;
          }

          const node = await repo.uploadScreenshot(buffer, conf.vars.INTERNAL_ID);

          nodes.push(node);
        }



        // Delete deprecated nodes
        const deprecatedNodes = screenshotsOld.filter(el => !nodes.some(node => el.pull_hash === node.pull_hash));

        for (const key in deprecatedNodes) {
          const node = deprecatedNodes[key];

          await repo.removeScreenshot(node.pull_hash, conf.vars.INTERNAL_ID);
        }
      }
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: Shikimori update failed, skipping... [id: ${document.id}]`, e);
    }



    // // * Pull ashdi
    // try {
    //   Logger.warn(`[AnimeBulkUpdate]: Ashdi update is not yet implemented, skipping... [id: ${document.id}]`);
    // } catch (e) {
    //   Logger.error(`[AnimeBulkUpdate]: Ashdi update failed, skipping... [id: ${document.id}]`, e);
    // }



    await repo.save();

    Logger.info(`[AnimeBulkUpdate]: Anime document bulk updated within ${endWithin(startedAt)}. [id: ${document.id}]`);
  } catch (e) {
    Logger.error(`[AnimeBulkUpdate]: Cannot update the document`, e);
  }
}



/** 
 * Anime bulk update CRON
 */
export async function AnimeBulkUpdateCRON() {
  setTimeout(async () => {
    await AnimeBulkUpdate();
    AnimeBulkUpdateCRON();
  }, ms('5sec'));
}



async function awaitCache() {
  if (ANIME_LISTS_CACHE && UAPOSTERS_CACHE) return;

  await new Promise(res => {
    cacheAwaitI += 1;
    Logger.verbose(`[AnimeBulkUpdate]: Awaiting cache (x${cacheAwaitI})`);

    setTimeout(async () => {
      await awaitCache();
      res(1);
    }, 3000);
  });
}

function parseHikkaGenres(input: IHikkaGenre[]): ANIME_GENRE[] {
  const genres: ANIME_GENRE[] = [];

  input?.forEach(genre => {
    if (Object.values(ANIME_GENRE).includes(genre.slug.toLowerCase() as ANIME_GENRE)) genres.push(genre.slug.toLowerCase() as ANIME_GENRE);
  });

  return genres;
}

function parseHikkaSchedule(input: IHikkaScheduleItem[]): IAnimeSchedule[] {
  const schedule: IAnimeSchedule[] = [];

  input.forEach(item => {
    schedule.push({ episode: item.episode, airing_at: getUTC(item.airing_at * 1000).ISO });
  });

  return schedule;
}

function parseJikanStudios(input: IJikanMalEntity[]): IAnimeStudio[] {
  const studios: IAnimeStudio[] = [];

  input.forEach(item => studios.push({ mal_id: item.mal_id, name: item.name }));

  return studios;
}

function parseJikanRelations(input: IJikanRelation[]): IAnimeRelation[] {
  const relations: IAnimeRelation[] = [];

  input.forEach(relation => {
    relation.entry.forEach(item => relations.push({ mal_id: item.mal_id, type: item.type, relation: relation.relation }));
  });

  return relations;
}

function parseJikanEpisodes(input: IJikanAnimeEpisodeMeta[]): IAnimeEpisode[] {
  const eps: IAnimeEpisode[] = [];

  input.forEach(ep => {
    eps.push({ aired: ep.aired ? getUTC(ep.aired).ISO : null, episode: ep.mal_id, filler: ep.filler, recap: ep.recap, score: ep.score, title: ep.title });
  });

  return eps;
}