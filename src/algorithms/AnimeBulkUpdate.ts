import AnimeModel from '~/repo/old/AnimeModel';
import AnimeRepository, { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import IAnime, { ANIME_GENRE, IAnimeEpisodeMeta, IAnimePosterNode, IAnimeRelation, IAnimeSchedule, IAnimeScreenshotNode, IAnimeStudio } from '~/intf/IAnime';
import Logger from '~/service/LoggerService';
import axios from 'axios';
import conf from '~/config';
import fs from 'fs';
import { HikkaAPI } from '~/api/external/hikka.api';
import { IHikkaGenre, IHikkaScheduleItem } from '~/intf/external-api/IHikka.api';
import { IJikanAnimeEpisodeMeta, IJikanMalEntity, IJikanRelation } from '~/intf/external-api/IJikan.api';
import { ISODateString } from '~/intf/types';
import { IdsMoeAPI } from '~/api/external/idsmoe.api';
import { JikanAPI } from '~/api/external/jikan.api';
import { ShikimoriAPI } from '~/api/external/shikimori.api';
import { buffer2hash, getUTC } from '~/utils/utils';



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
let UPDATE_YEAR = getUTC().year;
let ANIME_LISTS_CACHE: IAnimeListCacheItem[] | null = null;
let UAPOSTERS_CACHE: IUAPostersCacheItem[] | null = null;



const CACHE_FOLDER = `./.cache`;
const ANIME_LISTS_CACHE_PATH = `${CACHE_FOLDER}/bulk-ids.json`;
const UAPOSTERS_CACHE_PATH = `${CACHE_FOLDER}/bulk-posters.json`;
const CACHE_REVALIDATION_TIMEOUT = 60000 * 60 * 24 * 3; // 3d



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



  // Revalidate annime lists cache 
  if (getUTC(alc.updated_at).timestamp < getUTC().timestamp - CACHE_REVALIDATION_TIMEOUT) {
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
  if (getUTC(upc.updated_at).timestamp < getUTC().timestamp - CACHE_REVALIDATION_TIMEOUT) {
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
    const document = await AnimeRepository.getOneByQuery<IAnime>({ mal_id: null, hikka_slug: { $ne: null }, year: UPDATE_YEAR });
    if (!document) return UPDATE_YEAR -= 1;

    const animeService = new AnimeRepositoryClass();
    await animeService.init(document.id);

    let hikkaPosterUrl: string | null = null;



    // * Pull hikka
    try {
      const hikkaRes = await HikkaAPI.getAnime(document.hikka_slug!);

      animeService.setMalId(hikkaRes.mal_id);

      await animeService.setTitle({ title_en: hikkaRes.title_en, title_ja: hikkaRes.title_ja, title_ua: hikkaRes.title_ua, synonyms: hikkaRes.synonyms });

      animeService.setSynopsis({ synopsis_en: hikkaRes.synopsis_en, synopsis_ua: hikkaRes.synopsis_ua });
      animeService.setEpisodesReleased(hikkaRes.episodes_released);
      animeService.setEpisodesTotal(hikkaRes.episodes_total);

      animeService.setType(animeService.parseType(hikkaRes.media_type));
      animeService.setStatus(animeService.parseStatus(hikkaRes.status));
      animeService.setSeason(animeService.parseSeason(hikkaRes.season));
      animeService.setRating(animeService.parseRating(hikkaRes.rating));

      animeService.setScore({ score: hikkaRes.score, scoredBy: hikkaRes.scored_by });
      animeService.setYear(hikkaRes.year);

      // Parse genres
      const genres = parseHikkaGenres(hikkaRes.genres);
      if (genres.length) animeService.setGenres(genres);

      // Parse schedule
      const schedule = parseHikkaSchedule(hikkaRes.schedule);
      if (schedule.length) animeService._setSchedule(schedule);

      animeService.setSync('hikka_sync', getUTC().ISO);

      hikkaPosterUrl = hikkaRes.image;
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: Hikka update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull myanimelist (jikan)
    try {
      const jikanRes = await JikanAPI.getAnime(animeService.document!.mal_id!);

      // Parse studios
      const studios = parseJikanStudios(jikanRes.studios);
      if (studios.length) animeService._setStudios(studios);

      // Parse relations
      const relations = parseJikanRelations(jikanRes.relations);
      if (relations.length) animeService._setRelations(relations);

      const jikanEpsRes = await JikanAPI.getAnimeEpisodeMeta(animeService.document!.mal_id!);
      if (jikanEpsRes.length) animeService._setEpisodesMeta(parseJikanEpisodes(jikanEpsRes));

      animeService.setSync('myanimelist_sync', getUTC().ISO);
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: MyAnimeList (Jikan) update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull imdb
    try {
      if (!animeService.document?.imdb_id) {
        let idsMoeId: string | null = null;

        try {
          const idsRes = await IdsMoeAPI.getIds(animeService.document!.mal_id!);

          idsMoeId = idsRes.imdb;
        } catch (e) { null; }

        const imdbId: string | undefined = idsMoeId ?? ANIME_LISTS_CACHE?.find(el => el.mal_id === animeService.document!.mal_id!)?.imdb_id;

        if (imdbId) await animeService.setIMDBId(imdbId);
      }
    } catch (e) {
      Logger.warn(`[AnimeBulkUpdate]: IMDB update failed, skipping... [id: ${document.id}]`, e);
    }




    // * Pull uaposters
    try {
      const posters = UAPOSTERS_CACHE?.find(el => el.hikka_url?.includes(animeService.document!.hikka_slug!))?.posters;

      if (posters?.length) {
        const postersOld = animeService.document?.posters ?? [];
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

          const node = await animeService.uploadPoster(buffer, conf.vars.INTERNAL_ID, authorId);

          nodes.push(node);
        }

        // Delete deprecated nodes
        const deprecatedNodes = postersOld.filter(el => !nodes.some(node => el.pull_hash === node.pull_hash));

        for (const key in deprecatedNodes) {
          const node = deprecatedNodes[key];

          await animeService.removePoster(node.pull_hash, conf.vars.INTERNAL_ID);
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
          if (!node) node = nodes.find(el => el.pull_hash === authors[0].hash)!;


          const author = authors.find(el => el.hash === node!.pull_hash);
          if (author) await animeService.setHeroPosterAuthor(author.authorId);

          await animeService.setIsPosterHero(node.pull_hash, true);
        }
      }
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: UAPosters update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull hikka poster
    try {
      if (!animeService.document?.posters.length && hikkaPosterUrl) {
        const res = await axios.get(hikkaPosterUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        await animeService.uploadPoster(buffer, conf.vars.INTERNAL_ID, null);
      }
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: Pull fallback poster failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull shikimori
    try {
      const shikimoriRes = await ShikimoriAPI.getAnime(animeService.document!.mal_id!);
      const screenshots = shikimoriRes.screenshots;

      if (screenshots?.length) {
        const screenshotsOld = animeService.document?.screenshots ?? [];
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

          const node = await animeService.uploadScreenshot(buffer, conf.vars.INTERNAL_ID);

          nodes.push(node);
        }

        // Delete deprecated nodes
        const deprecatedNodes = screenshotsOld.filter(el => !nodes.some(node => el.pull_hash === node.pull_hash));

        for (const key in deprecatedNodes) {
          const node = deprecatedNodes[key];

          await animeService.removeScreenshot(node.pull_hash, conf.vars.INTERNAL_ID);
        }
      }
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: Shikimori update failed, skipping... [id: ${document.id}]`, e);
    }



    // * Pull old ID with mal id
    try {
      if (animeService.document?.mal_id) {
        const oldDocument = await AnimeModel.findOne({ malId: animeService.document?.mal_id });

        if (oldDocument) animeService._implicitSetId(oldDocument.uuid);
      }
    } catch (e) {
      Logger.error(`[AnimeBulkUpdate]: Pull old id failed, skipping... [id: ${document.id}]`, e);
    }



    // // * Pull ashdi
    // try {
    //   Logger.warn(`[AnimeBulkUpdate]: Ashdi update is not yet implemented, skipping... [id: ${document.id}]`);
    // } catch (e) {
    //   Logger.error(`[AnimeBulkUpdate]: Ashdi update failed, skipping... [id: ${document.id}]`, e);
    // }



    await animeService.save();

    Logger.info(`[AnimeBulkUpdate]: Anime document bulk update succeeded. [id: ${document.id}]`);
  } catch (e) {
    Logger.error(`[AnimeBulkUpdate]: Cannot update the document`, e);
  }
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

function parseJikanEpisodes(input: IJikanAnimeEpisodeMeta[]): IAnimeEpisodeMeta[] {
  const eps: IAnimeEpisodeMeta[] = [];

  input.forEach(ep => {
    eps.push({ aired: ep.aired ? getUTC(ep.aired).ISO : null, episode: ep.mal_id, filler: ep.filler, recap: ep.recap, score: ep.score, title: ep.title });
  });

  return eps;
}