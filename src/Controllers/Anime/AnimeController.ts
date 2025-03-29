import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import CacheService from '~/services/CacheService';
import DubberModel from '~/core/models/DubberModel';
import DubberService from '~/core/services/DubberService';
import Search from '~/services/SearchService';
import getUTC from '~/utils/get-utc';
import { ANIME_MEDIA_TYPE, ANIME_RATE, Anime, HydratedAnime } from '~/core/interfaces/AnimeIntf';
import { AnimeDeleteByUuidProps, AnimeFeatured, AnimeGetAll, AnimeGetByQuery, AnimeGetByQueryProps, AnimeGetSearch, AnimeGetSearchProps, AnimePostProps } from './AnimeControllerTypes';
import { AnimeMetadataMapper, DubberCompactMapper } from '~/utils/data-mappers';
import { DaysOfWeek } from '~/core/interfaces/types';
import { DocumentDTO, MongoDocumentDTO } from '~/core/services/DTO';
import { HydrateAnimeDocument } from '~/utils/data-mappers';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';




//* ===================================== GET ALL
/**
 * Get all anime documents count, updated (where rate is not G and media type is not OVA) and fullfilled (updated with malId specified)
 * 
 * @returns AnimeGetAll
 */
async function GetAll(): Promise<AnimeGetAll> {
  const animeService = new AnimeService();
  const documents = await animeService.getAll();

  const total = documents.length;
  // All parsed anime documents by default were with G rate and OVA status
  const updated = documents.filter(el => el.rate !== ANIME_RATE.G && el.media === ANIME_MEDIA_TYPE.OVA);
  const fullfilled = updated.filter(el => el.malId !== null);

  return {
    total,
    updated: updated.length,
    fullfilled: fullfilled.length
  };
}



//* ===================================== GET SEARCH
/**
 * Search anime by uuid, slug or names
 * 
 * @see AnimeGetSearchProps
 * @returns AnimeGetSearch
 */
async function GetSearch({ q }: AnimeGetSearchProps): Promise<AnimeGetSearch> {
  const limit = 15;

  let animeResults: Anime[] = [];
  let dubbedEpisodes: AnimeGetSearch['extended']['dubbedEpisodes'] = {};

  if (q === '~all') {
    // Get all
    animeResults = (await AnimeModel.find()).slice(0, limit).map(el => new MongoDocumentDTO().anime({ document: el, details: true }));
  } else if (q === '~wo-mal-id') {
    // Get all without mail id
    animeResults = (await AnimeModel.find({ malId: null })).slice(0, limit).map(el => new MongoDocumentDTO().anime({ document: el, details: true }));
  } else {
    animeResults = Search.search({ query: q, engine: 'anime', limit });
  }

  const results: HydratedAnime[] = [];

  animeResults.forEach(anime => {
    let maxEp: number | null = 0;

    if (anime.episodes?.length > 0) {
      anime.episodes.forEach(ep => ep.order > Number(maxEp) ? maxEp = ep.order : null);
    } else {
      maxEp = null;
    }

    dubbedEpisodes[anime.uuid] = maxEp;
    results.push(HydrateAnimeDocument(new DocumentDTO().anime({ object: anime })));
  });



  return {
    results,
    extended: {
      dubbedEpisodes
    }
  };
}



//* ===================================== GET FEATURED
const AnimeFeaturedCacheID = '~featured';
const AnimeFeaturedCache = new CacheService<AnimeFeatured>('AnimeFeaturedCache');

/**
 * Get featured anime list for home page
 * 
 * @returns AnimeFeatured
 */
async function GetFeatured(): Promise<AnimeFeatured> {
  const cache = AnimeFeaturedCache.get({ id: AnimeFeaturedCacheID });
  if (cache) return cache;

  const featured: AnimeFeatured = {
    headliners: [],
    hot: [],
    rated: [],
    updatedRecently: []
  };

  try {
    const animes = await new AnimeService().getAll(true);

    // Parse headliners
    for (const key in config.STATIC.AnimeFeatured.headliners) {
      const { backgroundURL, id, videoURL } = config.STATIC.AnimeFeatured.headliners[key];
      const anime = await new AnimeService().getById(id);

      featured.headliners.push({
        ...anime,
        backgroundURL,
        videoURL
      });
    }

    // Process hot
    featured.hot = (await AnimeModel.find(
      { uuid: { $in: config.STATIC.AnimeFeatured.hot } }
    )).map(el => HydrateAnimeDocument(new MongoDocumentDTO().anime({ document: el })));

    // Process recently updated
    featured.updatedRecently = animes.sort(
      (a, b) => b.updatedAt - a.updatedAt
    ).slice(0, 20).map(el => HydrateAnimeDocument(new DocumentDTO().anime({ object: el })));

    // Process rated
    featured.rated = animes.filter(el => el.score.mal !== null).sort(
      (a, b) => b.score!.mal! - a.score!.mal!
    ).slice(0, 20).map(el => HydrateAnimeDocument(new DocumentDTO().anime({ object: el })));

    AnimeFeaturedCache.push({
      id: AnimeFeaturedCacheID,
      createdAt: getUTC().timestamp,
      data: featured
    });
  } catch (e) {
    Logger.fail(`[AnimeController]: AnimeFeatured processed with error`, e);
  }

  return featured;
}



//* ===================================== GET BY QUERY
/**
 * Get anime document by query (uuid, slug, malId). Parse genres & etc or return only metadata
 * 
 * @see AnimeGetByQueryProps
 * @returns AnimeGetByQuery
 */
async function GetByQuery({ query, metadataOnly, detailed, fetchDubbers, fetchRelated }: AnimeGetByQueryProps): Promise<AnimeGetByQuery> {
  const animeService = new AnimeService();
  await animeService.init(query);

  const anime = animeService.anime;

  // Sync with myanimelist
  await animeService.syncWithMyAnimeList();

  let related: AnimeGetByQuery['related'] = undefined;
  let dubbers: AnimeGetByQuery['dubbers'] = undefined;
  let metadata: AnimeGetByQuery['metadata'] = undefined;
  let posterAdapt: AnimeGetByQuery['posterAdapt'] = undefined;
  let nextBroadcast: AnimeGetByQuery['nextBroadcast'] = undefined;



  // Handle metadataOnly
  if (metadataOnly) metadata = AnimeMetadataMapper(anime);

  // Fetch dubbers & related & next broadcast
  if (detailed && !metadataOnly) {
    if (fetchDubbers) {
      const dubberIds = [...new Set(anime.episodes.map(el => el.dubberID))];

      if (dubberIds.length) {
        const results = await DubberModel.find({ id: { $in: dubberIds } });
        dubbers = results.map(dubber => DubberCompactMapper(new MongoDocumentDTO().dubber({ document: dubber })));
      } else {
        dubbers = [];
      }
    }

    if (fetchRelated) {
      if (anime.related.length) {
        const results = await AnimeModel.find({ uuid: { $in: anime.related } });
        related = results.map(anime => HydrateAnimeDocument(new MongoDocumentDTO().anime({ document: anime })));
      } else {
        related = [];
      }
    }

    //! && anime.status === ANIME_STATUS.CURRENTLY_AIRING
    if (anime.broadcast) {
      const dayIndex = DaysOfWeek.findIndex(el => el === anime.broadcast?.day);
      const jstH = 23;
      const jstM = 30;

      const time = new Date();
      const dayDiff = (dayIndex - getUTC().weekDay + 7) % 7;

      time.setDate(getUTC().date + dayDiff);
      time.setUTCHours(jstH - 9);
      time.setUTCMinutes(jstM);
      time.setUTCSeconds(0);
      time.setMilliseconds(0);

      nextBroadcast = +time;
    } else {
      nextBroadcast = null;
    }

    // Fetch poster adapt
    if (anime.posterAdapt) {
      const dubber = dubbers?.find(el => el.id === anime.posterAdapt);

      if (!dubber) {
        // Fetch dubber
        try {
          const dubber = await new DubberService().getById(anime.posterAdapt);

          posterAdapt = DubberCompactMapper(new DocumentDTO().dubber({ object: dubber }));
        } catch (e) { Logger.fail(`[AnimeController]: Cannot find poster adapt dubber. [id: ${anime.posterAdapt}]`); }
      } else {
        // Get dubber from anime dubbing
        posterAdapt = dubber;
      }
    } else {
      posterAdapt = null;
    }
  }

  let hydrated = HydrateAnimeDocument(detailed ? anime : new DocumentDTO().anime({ object: anime }));

  // @ts-expect-error Hide hydrated when metadata only
  if (metadataOnly) hydrated = undefined;



  return {
    ...hydrated,
    dubbers,
    related,
    metadata,
    posterAdapt,
    nextBroadcast
  };
}



//* ===================================== POST ANIME
/** 
 * Create new anime document
 * 
 * @see AnimePostProps
 * @returns Anime
 */
async function PostAnime({ nameEng }: AnimePostProps): Promise<Anime> {
  return await new AnimeService().create({ nameEng });
}



//* ===================================== POST EPISODE



//* ===================================== PUT POSTER



//* ===================================== PATCH BY UUID



//* ===================================== DELETE EPISODE



//* ===================================== DELETE BY UUID
/**
 * Delete anime document
 */
async function DeleteByUuid({ uuid }: AnimeDeleteByUuidProps): Promise<void> {
  await new AnimeService().deleteOne(uuid);
}





export default class AnimeController {
  static GetAll = GetAll;
  static GetByQuery = GetByQuery;
  static GetSearch = GetSearch;
  static GetFeatured = GetFeatured;

  static PostAnime = PostAnime;

  static DeleteByUuid = DeleteByUuid;
}