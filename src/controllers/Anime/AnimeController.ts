import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import CacheService from '~/services/CacheService';
import DubberModel from '~/core/models/DubberModel';
import Search from '~/services/SearchService';
import getUTC from '~/utils/get-utc';
import { ANIME_MEDIA_TYPE, ANIME_RATE, Anime, HydratedAnime } from '~/core/interfaces/AnimeIntf';
import { AnimeDeleteByUuidProps, AnimeFeatured, AnimeGetAll, AnimeGetByQuery, AnimeGetByQueryProps, AnimeGetSearch, AnimeGetSearchProps, AnimePostProps } from './AnimeControllerTypes';
import { AnimeMetadataMapper, AnimeRelatedMapper, DubberMetadataMapper } from '~/utils/data-mappers';
import { DocumentDTO, MongoDocumentDTO } from '~/core/services/DTO';
import { HydrateAnimeDocument } from '~/utils/hydrate-document';
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
    results.push(HydrateAnimeDocument(new DocumentDTO().anime({ object: anime })));
  });

  return results;
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
  if (anime.malId !== null && getUTC().timestamp > Number(anime.malSyncedAt) + config.vars.MyAnimeListSyncTimeout) await animeService.syncWithMyAnimeList();

  let related: AnimeGetByQuery['related'] = undefined;
  let dubbers: AnimeGetByQuery['dubbers'] = undefined;
  let metadata: AnimeGetByQuery['metadata'] = undefined;



  // Handle metadataOnly
  if (metadataOnly) metadata = AnimeMetadataMapper(anime);

  // Fetch dubbers & related
  if (detailed && !metadataOnly) {
    if (fetchDubbers) {
      const dubberIds = [...new Set(anime.episodes.map(el => el.dubberID))];

      if (dubberIds.length) {
        const results = await DubberModel.find({ $or: dubberIds.map(el => { return { id: el }; }) });
        dubbers = results.map(dubber => DubberMetadataMapper(new MongoDocumentDTO().dubber({ document: dubber })));
      } else {
        dubbers = [];
      }
    }

    if (fetchRelated) {
      if (anime.related.length) {
        const results = await AnimeModel.find({ $or: anime.related.map(el => { return { id: el }; }) });
        related = results.map(anime => AnimeRelatedMapper(new MongoDocumentDTO().anime({ document: anime })));
      } else {
        related = [];
      }
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