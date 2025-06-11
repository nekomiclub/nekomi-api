import Anime, { ANIME_MEDIA_TYPE, ANIME_RATE, ANIME_STATUS, HydratedAnime } from '~/core/interfaces/Anime.intf';
import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import CacheService from '~/services/CacheService';
import DocumentDTO from '~/core/services/DTOService';
import DubberModel from '~/core/models/DubberModel';
import DubberService from '~/core/services/DubberService';
import Search from '~/services/SearchService';
import UserService from '~/core/services/UserService';
import createID from '~/utils/create-id';
import getUTC from '~/utils/get-utc';
import multer from 'multer';
import { AnimeDeleteEpisodeProps, AnimeFeatured, AnimeGetByQuery, AnimeGetByQueryProps, AnimeGetSearch, AnimeGetSearchProps, AnimeGetStats, AnimePatchByUuidProps, AnimePatchByUuidSchema, AnimePostEpisode, AnimePostEpisodeProps, AnimePutPoster, AnimePutPosterProps } from './AnimeControllerTypes';
import { AnimeMetadataMapper, DubberCompactMapper, HydrateAnimeDocument } from '~/utils/data-mappers';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { DaysOfWeek } from '~/core/interfaces/types';
import { E401, ERR_INVALID_PAYLOAD } from '~/services/ErrorService';
import { GetCheckCSRFMock } from '~/utils/testing';
import { HTTPEndpoint } from '~/services/HTTPService';
import { Logger } from '~/services/LoggerService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { TestMode, config } from '~/config';
import { body, param, query } from 'express-validator';
import { parseObjectTypes } from '~/utils/parse-object-types';
import { signCSRFToken } from '~/services/TokenService';
import { z } from 'zod';



const upload = multer();



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  const { q } = parseObjectTypes<AnimeGetSearchProps>(req.query);



  const limit = 15;

  let animeResults: Anime[] = [];
  let dubbedEpisodes: AnimeGetSearch['extended']['dubbedEpisodes'] = {};

  if (q === '~all') {
    // Get all
    animeResults = (await AnimeModel.find()).slice(0, limit).map(doc => DocumentDTO.anime(doc, true));
  } else if (q === '~wo-mal-id') {
    // Get all without mail id
    animeResults = (await AnimeModel.find({ malId: null })).slice(0, limit).map(doc => DocumentDTO.anime(doc, true));
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
    results.push(HydrateAnimeDocument(DocumentDTO.anime(anime)));
  });



  const body: AnimeGetSearch = {
    results,
    extended: {
      dubbedEpisodes
    }
  };

  return res.status(200).json({ message: 'ok', ...body });
}, {
  requireMiddlewares: ['checkCSRF']
});

/** @tested */
const GetSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  query(['q']).notEmpty(),
  getSearch,
];



//* ===================================== GET STATS
const getStats = HTTPEndpoint(async (req, res) => {
  const animeService = new AnimeService();
  const documents = await animeService.getAll();

  const total = documents.length;
  // All parsed anime documents by default were with G rate and OVA status
  const updated = documents.filter(el => !(el.rate === ANIME_RATE.G && el.media === ANIME_MEDIA_TYPE.OVA));
  const fullfilled = updated.filter(el => el.malId !== null);

  const body: AnimeGetStats = {
    total,
    updated: updated.length,
    fullfilled: fullfilled.length
  };

  return res.status(200).json({ message: 'ok', ...body });
});

/** @tested */
const GetStats = [
  getStats,
];



//* ===================================== GET FEATURED
const AnimeFeaturedCacheID = '~featured';
const AnimeFeaturedCache = new CacheService<AnimeFeatured>('AnimeFeaturedCache');

const getFeatured = HTTPEndpoint(async (req, res) => {
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
    )).map(doc => HydrateAnimeDocument(DocumentDTO.anime(doc)));

    // Process recently updated
    featured.updatedRecently = animes.sort(
      (a, b) => b.updatedAt - a.updatedAt
    ).slice(0, 20).map(doc => HydrateAnimeDocument(DocumentDTO.anime(doc)));

    // Process rated
    featured.rated = animes.filter(el => el.score.mal !== null).sort(
      (a, b) => b.score!.mal! - a.score!.mal!
    ).slice(0, 20).map(doc => HydrateAnimeDocument(DocumentDTO.anime(doc)));

    AnimeFeaturedCache.push({
      id: AnimeFeaturedCacheID,
      createdAt: getUTC().timestamp,
      data: featured
    });
  } catch (e) {
    Logger.fail(`[AnimeController]: AnimeFeatured processed with error`, e);
  }



  const body: AnimeFeatured = featured;

  return res.status(200).json({ message: 'ok', ...body });
}, {
  requireMiddlewares: ['checkCSRF']
});

/** @tested */
const GetFeatured = [
  CheckCSRF([config.DOMAIN.nekomi]),
  getFeatured
];



//* ===================================== GET BY QUERY
const getByQuery = HTTPEndpoint(async (req, res) => {
  const { query } = parseObjectTypes<AnimeGetByQueryProps>(req.params);
  const { metadataOnly, fetchDubbers, fetchRelated } = parseObjectTypes<AnimeGetByQueryProps>(req.query);
  const CSRF_Token = req.headers[config.vars.csrfHeader.toLowerCase()] as string | undefined;
  let { detailed } = parseObjectTypes<AnimeGetByQueryProps>(req.query);

  if (detailed) {
    if (!CSRF_Token) throw new E401;

    await new MiddlewareService().checkCSRF({
      token: CSRF_Token,
      origins: [config.DOMAIN.nekomi],
      mock: TestMode ? GetCheckCSRFMock(req) : undefined
    });
  }



  const animeService = new AnimeService();
  await animeService.init(query);

  // Sync
  await animeService.syncWithMyAnimeList();

  const anime = animeService.anime;

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
        dubbers = results.map(doc => DubberCompactMapper(DocumentDTO.dubber(doc)));
      } else {
        dubbers = [];
      }
    }

    if (fetchRelated) {
      if (anime.related.length) {
        const results = await AnimeModel.find({ uuid: { $in: anime.related } });
        related = results.map(doc => HydrateAnimeDocument(DocumentDTO.anime(doc)));
      } else {
        related = [];
      }
    }

    if (anime.broadcast && anime.status === ANIME_STATUS.CURRENTLY_AIRING) {
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

          posterAdapt = DubberCompactMapper(DocumentDTO.dubber(dubber));
        } catch (e) { Logger.fail(`[AnimeController]: Cannot find poster adapt dubber. [id: ${anime.posterAdapt}]`); }
      } else {
        // Get dubber from anime dubbing
        posterAdapt = dubber;
      }
    } else {
      posterAdapt = null;
    }
  }

  let hydrated = HydrateAnimeDocument(DocumentDTO.anime(anime, detailed));

  // @ts-expect-error Hide hydrated when metadata only
  if (metadataOnly) hydrated = undefined;



  const body: AnimeGetByQuery = {
    ...hydrated,
    dubbers,
    related,
    metadata,
    posterAdapt,
    nextBroadcast
  };

  return res.status(200).json({ message: 'ok', ...body });
});

/** @tested */
const GetByQuery = [
  param('query').notEmpty(),
  getByQuery,
];


//* ===================================== POST ANIME
const postAnime = HTTPEndpoint(async (req, res) => {
  const nameEng = `untitled-${createID(4)}`;

  const anime = await new AnimeService().create({ nameEng });



  return res.status(201).json({ message: 'ok', anime });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

/** @tested */
const PostAnime = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleAdd']),
  postAnime,
];



//* ===================================== POST EPISODE
const postEpisode = HTTPEndpoint(async (req, res) => {
  let { uuid, qualities, order, dubberId } = req.body as AnimePostEpisodeProps;

  const schema = z.object({
    uuid: z.string(),
    qualities: z.number().array(),
    order: z.number(),
    dubberId: z.string()
  });

  order = +order;
  // @ts-ignore
  qualities = JSON.parse(qualities).map(el => +el);

  schema.parse({ uuid, qualities, order, dubberId });

  const file = req.file;
  if (!file) throw new ERR_INVALID_PAYLOAD(`File is not specified`);

  const user = await new UserService().getById(req.nekomi.user?.id ?? '', true);



  const animeService = new AnimeService();
  await animeService.init(uuid);

  const { episode } = await animeService.uploadEpisode(file, { dubberId, order, qualities, user });



  const body: AnimePostEpisode = {
    episode
  };

  return res.status(201).json({ message: 'ok', ...body });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const PostEpisode = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['seriesAdd']),
  upload.single('file'),
  postEpisode,
];



//* ===================================== PUT POSTER
const putPoster = HTTPEndpoint(async (req, res) => {
  const { uuid } = req.body as AnimePutPosterProps;

  const file = req.file;
  if (!file) throw new ERR_INVALID_PAYLOAD(`File is not specified`);

  const user = await new UserService().getById(req.nekomi.user?.id ?? '', true);



  const animeService = new AnimeService();
  await animeService.init(uuid);

  const { url } = await animeService.putPoster(file, { user });



  const body: AnimePutPoster = {
    url
  };

  return res.status(200).json({ message: 'ok', ...body });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const PutPoster = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleEdit']),
  upload.single('file'),
  body('uuid').notEmpty().isString(), // Must be below multer middleware
  putPoster
];



//* ===================================== PATCH BY UUID
const patchByUuid = HTTPEndpoint(async (req, res) => {
  AnimePatchByUuidSchema.parse(req.body);

  const { uuid, nameAlt, nameEng, nameUkr, description, details, episodesCount, genres, malId, malScoredBy, media, posterAdapt, rate, scoreIMDB, scoreMAL, season, status, studios, year } = req.body as AnimePatchByUuidProps;

  const animeService = new AnimeService();
  await animeService.init(uuid);



  // Patches
  if (nameAlt?.length || nameEng !== undefined || nameUkr !== undefined) await animeService.setNames({ alt: nameAlt, eng: nameEng, ukr: nameUkr });
  if (description !== undefined) animeService.setDescription(description);
  if (details !== undefined) animeService.setDetails(details);
  if (episodesCount !== undefined) animeService.setEpisodesCount(episodesCount);
  if (genres !== undefined) animeService.setGenres(animeService.parseGenres(genres));
  if (malId !== undefined) animeService.setMalId(malId);
  if (posterAdapt !== undefined) await animeService.setPosterAdapt(posterAdapt);
  if (media !== undefined) animeService.setMedia(animeService.parseMedia(media));
  if (rate !== undefined) animeService.setRate(animeService.parseRate(rate));
  if (season !== undefined) animeService.setSeason(animeService.parseSeason(season));
  if (status !== undefined) animeService.setStatus(animeService.parseStatus(status));
  if (scoreMAL !== undefined || scoreIMDB !== undefined || malScoredBy !== undefined) animeService.setScore({ imdb: scoreIMDB, mal: scoreMAL, malScoredBy });
  if (studios !== undefined) animeService.setStudios(studios.map(el => { return { name: el, malId: -1 }; }));
  if (year !== undefined) animeService.setYear(year);



  await animeService.save();

  return res.status(200).json({ message: 'ok' });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const PatchByUuid = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleEdit']),
  patchByUuid
];



//* ===================================== DELETE EPISODE
const deleteEpisode = HTTPEndpoint(async (req, res) => {
  let { dubberId, order, uuid } = req.body as AnimeDeleteEpisodeProps;

  const schema = z.object({
    uuid: z.string(),
    order: z.number(),
    dubberId: z.string()
  });

  order = +order;

  schema.parse({ dubberId, order, uuid });

  const user = await new UserService().getById(req.nekomi.user?.id ?? '', true);



  const animeService = new AnimeService();
  await animeService.init(uuid);

  await animeService.deleteEpisode({ dubberId, order, user });



  return res.status(200).json({ message: 'ok' });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const DeleteEpisode = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['seriesDelete']),
  deleteEpisode
];



//* ===================================== DELETE BY UUID
const deleteByUuid = HTTPEndpoint(async (req, res) => {
  const { uuid } = req.params as { uuid: string };
  const { token } = req.query as { token?: string };

  if (!token) {
    console.log(`-- INCOME DELETE ANIME REQUEST; TOKEN START --`);
    console.log(signCSRFToken());
    console.log(`-- INCOME DELETE ANIME REQUEST; TOKEN END --`);

    throw new E401(`Not authorized`);
  }

  if (!TestMode) {
    await new MiddlewareService().checkCSRF({ token, origins: [config.DOMAIN.nekomi_core] });
  }



  await new AnimeService().deleteOne(uuid);



  return res.status(200).json({ message: 'ok' });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

/** @tested */
const DeleteByUuid = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleDelete']),
  deleteByUuid,
];





export default class AnimeController {
  static GetStats = GetStats;
  static GetByQuery = GetByQuery;
  static GetSearch = GetSearch;
  static GetFeatured = GetFeatured;

  static PostAnime = PostAnime;
  static PostEpisode = PostEpisode;

  static PutPoster = PutPoster;

  static PatchByUuid = PatchByUuid;

  static DeleteByUuid = DeleteByUuid;
  static DeleteEpisode = DeleteEpisode;
}