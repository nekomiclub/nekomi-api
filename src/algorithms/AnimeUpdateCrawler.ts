import AnimeRepository, { AnimeRepositoryClass } from '~/repositories/AnimeRepository.js';
import IAnime, { IAnimeEpisode, IAnimePosterNode, IAnimeRelation, IAnimeSchedule, IAnimeStudio } from '~/schemas/entities/Anime.schema.js';
import Logger from '~/services/LoggerService.js';
import StackServiceClass from '~/services/StackService.js';
import axios from 'axios';
import conf from '~/conf.js';
import fs from 'fs';
import ms from 'ms';
import { ANIME_GENRE, ANIME_SEASON } from '~/data/AnimePrimitives.js';
import { AnimeId, ISODateString } from '~/interfaces/BrandedIds.js';
import { ArgumentTypes } from '~/interfaces/types.js';
import { HikkaAPI } from '~/api/external/hikka.api.js';
import { IHikkaGenre, IHikkaScheduleItem } from '~/interfaces/external-api/IHikka.api.js';
import { IJikanAnimeEpisode, IJikanMalEntity, IJikanRelation } from '~/interfaces/external-api/IJikan.api.js';
import { IdsMoeAPI } from '~/api/external/idsmoe.api.js';
import { JikanAPI } from '~/api/external/jikan.api.js';
import { buffer2hash, extractAnimeContentSeason, getUTC, sleep } from '~/utils/utils.js';



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
let ANIME_LISTS_CACHE: IAnimeListCacheItem[] | null = null;
let UAPOSTERS_CACHE: IUAPostersCacheItem[] | null = null;



const CACHE_FOLDER = conf.variables.volumes.cache;
const ANIME_LISTS_CACHE_PATH = `${CACHE_FOLDER}/bulk-ids.json`;
const UAPOSTERS_CACHE_PATH = `${CACHE_FOLDER}/bulk-posters.json`;
const CACHE_REVALIDATION_TIMEOUT_MS = ms('3day');



// TODO: Rework into admin repository
const UAPOSTERS_AUTHOR_MAP = {
  'Візуали': '48a9b773-32c0-4c6f-b522-e5d6a0aa66a2',
  'uaposters': '442b01b5-1387-4486-90dc-efee5049ef2c',
  'Олехандро': '9f5e809e-1816-41f8-98db-6b07e7b6851d',
  'Лунсар': '7fb630e1-d6a8-456a-866a-796c299cdb89',
  'Anna': null,
  'DrBryan': null,
  'Fanat22012': null,
  'Mikai': null,
  'Otaku-First': null,
  'Raffaelle': null,
  'Sashichak': null,
  'gnick1': null,
  'honeychan': null,
  'uanime': null,
  'Локалізовані': null,
  'Пан Олександр': null,
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
      Logger.debug(`[AnimeUpdateCrawler]: Cache for ALC revalidated`);
    } catch (e) {
      Logger.error(`[AnimeUpdateCrawler]: An error occured while updating cache for ALC`, e);
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
      Logger.debug(`[AnimeUpdateCrawler]: Cache for UPC revalidated`);
    } catch (e) {
      Logger.error(`[AnimeUpdateCrawler]: An error occured while updating cache for UPC`, e);
    }
  } else {
    UAPOSTERS_CACHE = (JSON.parse(fs.readFileSync(UAPOSTERS_CACHE_PATH).toString()) as UAPostersCacheType).data;
  }




  Logger.debug(`[AnimeUpdateCrawler]: Cache updated!`);

  isCacheRevalidated = true;
}

async function awaitCache() {
  if (ANIME_LISTS_CACHE && UAPOSTERS_CACHE) return;

  await new Promise(res => {
    cacheAwaitI += 1;
    Logger.verbose(`[AnimeUpdateCrawler]: Awaiting cache (x${cacheAwaitI})`);

    setTimeout(async () => {
      await awaitCache();
      res(1);
    }, 3000);
  });
}



class AnimeUpdateCrawlerClass {
  private service: StackServiceClass<AnimeId>;



  constructor() {
    this.service = new StackServiceClass('AnimeUpdateCrawler', async (...props: ArgumentTypes<typeof this.job>) => await this.job(...props));
  }



  async reset() {
    Logger.debug(`[AnimeUpdateCrawler]: Reset performed`);

    this.service.dropAll();



    /** 
     * Seasonal anime must be resynced each 2 days
     */
    const seasonal = await AnimeRepository.getSortedMany({
      mal_id: { $ne: null },
      year: getUTC().year,
      season: ANIME_SEASON.WINTER, // TODO: Math season with current

      $or: [
        { about_synced_at: null },
        { about_synced_at: { $lt: getUTC(getUTC().timestamp - ms('2 day')).ISO } },
      ]
    }, { sort: { about_synced_at: 'ascending' }, limit: 50 });

    /**
     * Anime from different seasons of current year must be resynced each 5 days
     */
    const oldSeasons = await AnimeRepository.getSortedMany({
      mal_id: { $ne: null },
      year: getUTC().year,
      $or: [
        { about_synced_at: null },
        { about_synced_at: { $lt: getUTC(getUTC().timestamp - ms('5 day')).ISO } },
      ]
    }, { sort: { about_synced_at: 'ascending' }, limit: 100 });

    /**
     * Old anime must be resynced each 14 days
     */
    const olds = await AnimeRepository.getSortedMany({
      mal_id: { $ne: null },
      $or: [
        { about_synced_at: null },
        { about_synced_at: { $lt: getUTC(getUTC().timestamp - ms('14 day')).ISO } },
      ]
    }, { sort: { about_synced_at: 'ascending' }, limit: 200 });



    seasonal.forEach(document => this.service.append(document.id, { doNotRun: true }));
    oldSeasons.forEach(document => this.service.append(document.id, { doNotRun: true }));
    olds.forEach(document => this.service.append(document.id, { doNotRun: true }));

    this.service.run();
  }



  async syncAnimeDocument(id: AnimeId): Promise<IAnime> {
    await getCache();
    await awaitCache();

    const repo = new AnimeRepositoryClass();
    await repo.init({ id });



    // * === Pull hikka.io
    try {
      if (repo.document.hikka_slug) {
        const res = await HikkaAPI.getAnime(repo.document.hikka_slug);

        repo.setMalId(res.mal_id);
        repo.setTitle({ title_en: res.title_en, title_ja: res.title_ja, title_ua: res.title_ua, synonyms: res.synonyms });

        if (res.title_en) await repo.setSlug(res.title_en);
        if (res.title_ja && !res.title_en) await repo.setSlug(res.title_ja);

        repo.setSynopsis({ synopsis_en: res.synopsis_en, synopsis_ua: res.synopsis_ua });
        repo.setEpisodesReleased(res.episodes_released);
        repo.setEpisodesTotal(res.episodes_total);

        repo.setType(res.media_type ? repo.parseType(res.media_type) : null);
        repo.setStatus(res.status ? repo.parseStatus(res.status) : null);
        repo.setSeason(res.season ? repo.parseSeason(res.season) : null);
        repo.setRating(res.rating ? repo.parseRating(res.rating) : null);

        repo.setScore({ score: res.score, scoredBy: res.scored_by });
        repo.setYear(res.year);

        // Map genres
        const genres = mapHikkaGenres(res.genres);
        if (genres.length) repo._setGenres(genres);

        // Map schedule
        const schedule = mapHikkaSchedule(res.schedule);
        if (schedule.length) repo._setSchedule(schedule);
      }
    } catch (e) {
      Logger.error(`[AnimeUpdateCrawler]: Hikka sync failed, skipping... [id: ${repo.document.id}]`, e);
    }


    // * === Pull jikan
    try {
      if (repo.document.mal_id) {
        const res = await JikanAPI.getAnime(repo.document.mal_id);

        // Map studios
        const studios = mapJikanStudios(res.studios);
        if (studios.length) repo._setStudios(studios);

        // Map relations
        const relations = mapJikanRelations(res.relations);
        if (relations.length) repo._setRelations(relations);

        // Map episodes
        const jikanEpsRes = await JikanAPI.getAnimeEpisodeMeta(repo.document.mal_id);
        if (jikanEpsRes.length) repo._setEpisodesMeta(mapJikanEpisodes(jikanEpsRes));

        // Set synonyms
        repo.setTitle({ synonyms: [...repo.document.title_synonims, ...res.title_synonyms] });
      }
    } catch (e) {
      Logger.error(`[AnimeUpdateCrawler]: Jikan sync failed, skipping... [id: ${repo.document.id}]`, e);
    }


    // * === Pull imdb
    try {
      if (!repo.document.imdb_id && repo.document.mal_id) {
        let idsMoeId: string | null = null;

        try {
          const res = await IdsMoeAPI.getIds(repo.document.mal_id);

          idsMoeId = res.imdb;
        } catch (e) { null; }

        const imdbId: string | undefined = idsMoeId ?? ANIME_LISTS_CACHE?.find(el => el.mal_id === repo.document.mal_id)?.imdb_id;

        if (imdbId) await repo.setIMDBId(imdbId);
      }
    } catch (e) {
      Logger.error(`[AnimeUpdateCrawler]: IMDB sync failed, skipping... [id: ${repo.document.id}]`, e);
    }


    // * === Pull uaposters
    try {
      if (repo.document.hikka_slug) {
        const posters = UAPOSTERS_CACHE?.find(el => el.hikka_url?.includes(repo.document.hikka_slug!))?.posters;

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

            const node = await repo.uploadPoster(buffer, conf.variables.INTERNAL_ID, authorId, !authorId ? poster.author : undefined);

            nodes.push(node);
          }



          // Delete deprecated nodes
          const deprecatedNodes = postersOld.filter(el => !nodes.some(node => el.pull_hash === node.pull_hash));

          for (const key in deprecatedNodes) {
            const node = deprecatedNodes[key];

            await repo.removePoster(node.pull_hash, conf.variables.INTERNAL_ID);
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
      }
    } catch (e) {
      Logger.error(`[AnimeUpdateCrawler]: UaPosters sync failed, skipping... [id: ${repo.document.id}]`, e);
    }


    // * === Pull shikimori
    // try {
    //   if (anime.mal_id) {
    //     const res = await ShikimoriAPI.getAnime(anime.mal_id);
    //     const screenshots = res.screenshots;

    //     if (screenshots?.length) {
    //       const screenshotsOld = repo.document?.screenshots ?? [];
    //       const nodes: IAnimeScreenshotNode[] = [];


    //       for (const key in screenshots) {
    //         const screenshot = screenshots[key];

    //         const res = await axios.get(`https://shikimori.one${screenshot.original}`, { responseType: 'arraybuffer' });
    //         const buffer = Buffer.from(res.data);
    //         const hash = buffer2hash(buffer);

    //         // Skip upload if node exist
    //         const exist = screenshotsOld.find(el => el.pull_hash === hash);
    //         if (exist) {
    //           nodes.push(exist);
    //           continue;
    //         }

    //         const node = await repo.uploadScreenshot(buffer, conf.vars.INTERNAL_ID);

    //         nodes.push(node);
    //       }



    //       // Delete deprecated nodes
    //       const deprecatedNodes = screenshotsOld.filter(el => !nodes.some(node => el.pull_hash === node.pull_hash));

    //       for (const key in deprecatedNodes) {
    //         const node = deprecatedNodes[key];

    //         await repo.removeScreenshot(node.pull_hash, conf.vars.INTERNAL_ID);
    //       }
    //     }
    //   }
    // } catch (e) {
    //   Logger.error(`[AnimeUpdateCrawler]: Shikimori sync failed, skipping... [id: ${repo.document.id}]`, e);
    // }



    // * === Misc updates
    try {
      // Retrieve content season
      if (repo.document.mal_id) {
        const synonyms = [...repo.document.title_synonims, repo.document.title_en, repo.document.title_ja].filter(el => el !== null) as string[];

        const content_season = getContentSeason(synonyms);

        repo._set('content_season', content_season);
      }
    } catch (e) {
      Logger.error(`[AnimeUpdateCrawler]: Misc update failed, skipping... [id: ${repo.document.id}]`, e);
    }



    repo.setSync('about_synced_at', getUTC().ISO);

    await repo.save();

    return repo.document;
  }



  private async job(id: AnimeId) {
    await this.syncAnimeDocument(id);

    // Throttle
    await sleep(ms('2 sec'));
  }
}



const AnimeUpdateCrawler = new AnimeUpdateCrawlerClass();

export default AnimeUpdateCrawler;





export function getContentSeason(synonyms: string[]) {
  // Content season list, where key is season and value is matches
  const contentSeasonsList: Record<string, number> = {};
  let content_season = 1;

  synonyms.forEach(synonym => {
    const extracted = extractAnimeContentSeason(synonym);
    if (!extracted) return;

    if (contentSeasonsList[extracted]) contentSeasonsList[extracted] += 1;
    else contentSeasonsList[extracted] = 1;
  });

  content_season = Number(Math.max(...Object.keys(contentSeasonsList).map(Number)));

  return content_season;
}



function mapHikkaGenres(input: IHikkaGenre[]): ANIME_GENRE[] {
  const genres: ANIME_GENRE[] = [];

  input?.forEach(genre => {
    if (Object.values(ANIME_GENRE).includes(genre.slug.toLowerCase() as ANIME_GENRE)) genres.push(genre.slug.toLowerCase() as ANIME_GENRE);
  });

  return genres;
}

function mapHikkaSchedule(input: IHikkaScheduleItem[]): IAnimeSchedule[] {
  const schedule: IAnimeSchedule[] = [];

  input.forEach(item => {
    schedule.push({ episode: item.episode, airing_at: getUTC(item.airing_at * 1000).ISO });
  });

  return schedule;
}

function mapJikanStudios(input: IJikanMalEntity[]): IAnimeStudio[] {
  const studios: IAnimeStudio[] = [];

  input.forEach(item => studios.push({ mal_id: item.mal_id, name: item.name }));

  return studios;
}

function mapJikanRelations(input: IJikanRelation[]): IAnimeRelation[] {
  const relations: IAnimeRelation[] = [];

  input.forEach(relation => {
    relation.entry.forEach(item => relations.push({ mal_id: item.mal_id, type: item.type, relation: relation.relation }));
  });

  return relations;
}

function mapJikanEpisodes(input: IJikanAnimeEpisode[]): IAnimeEpisode[] {
  const eps: IAnimeEpisode[] = [];

  input.forEach(ep => {
    eps.push({ aired: ep.aired ? getUTC(ep.aired).ISO : null, episode: ep.mal_id, filler: ep.filler, recap: ep.recap, score: ep.score, title: ep.title });
  });

  return eps;
}