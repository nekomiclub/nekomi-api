import AnimeController from './AnimeController';
import AnimeService from '~/core/services/AnimeService';
import UserService from '~/core/services/UserService';
import createID from '~/utils/create-id';
import multer from 'multer';
import { AnimeDeleteEpisodeProps, AnimeGetByQueryProps, AnimeGetSearchProps, AnimePatchByUuidProps, AnimePatchByUuidSchema, AnimePostEpisodeProps, AnimePutPosterProps } from './AnimeControllerTypes';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { E401, ERR_INVALID_PAYLOAD, ERR_MIDDLEWARE_REQUIRED, ERR_MISSING_AUTHORIZATION } from '~/services/ErrorService';
import { GetCheckCSRFMock } from '~/utils/testing';
import { HTTPEndpoint } from '~/services/HTTPService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { TestMode, config } from '~/config';
import { body, param, query } from 'express-validator';
import { parseObjectTypes } from '~/utils/parse-object-types';
import { signCSRFToken } from '~/services/TokenService';
import { z } from 'zod';



const upload = multer();



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { q } = parseObjectTypes<AnimeGetSearchProps>(req.query);

  const data = await AnimeController.GetSearch({ q });

  return res.status(200).json({ message: 'ok', ...data });
});

/** @tested 2.1.0 */
const GetSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  query(['q']).notEmpty(),
  getSearch,
];



//* ===================================== GET ALL
const getAll = HTTPEndpoint(async (req, res) => {
  const data = await AnimeController.GetAll();

  return res.status(200).json({ message: 'ok', ...data });
});

/** @tested 2.1.0 */
const GetAll = [
  getAll,
];



//* ===================================== GET FEATURED
const getFeatured = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const data = await AnimeController.GetFeatured();

  return res.status(200).json({ message: 'ok', ...data });
});

/** @tested 2.1.0 */
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
    if (!CSRF_Token) throw new ERR_MISSING_AUTHORIZATION;

    await new MiddlewareService().checkCSRF({
      token: CSRF_Token,
      origins: [config.DOMAIN.nekomi],
      mock: TestMode ? GetCheckCSRFMock(req) : undefined
    });
  }

  const data = await AnimeController.GetByQuery({ query, detailed, metadataOnly, fetchDubbers, fetchRelated });

  return res.status(200).json({ message: 'ok', ...data });
});

/** @tested 2.1.0 */
const GetByQuery = [
  param('query').notEmpty(),
  getByQuery,
];


//* ===================================== POST ANIME
const postAnime = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const nameEng = `untitled-${createID(4)}`;
  const anime = await AnimeController.PostAnime({ nameEng });

  return res.status(201).json({ message: 'ok', anime });
});

/** @tested 2.1.0 */
const PostAnime = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleAdd']),
  postAnime,
];



//* ===================================== POST EPISODE
const postEpisode = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

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
  const { episode } = await AnimeController.PostEpisode({ dubberId, file, order, qualities, user, uuid });

  return res.status(201).json({ message: 'ok', episode });
});

const PostEpisode = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['seriesAdd']),
  upload.single('file'),
  postEpisode,
];



//* ===================================== PUT POSTER
const putPoster = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { uuid } = req.body as AnimePutPosterProps;

  const file = req.file;
  if (!file) throw new ERR_INVALID_PAYLOAD(`File is not specified`);

  const user = await new UserService().getById(req.nekomi.user?.id ?? '', true);
  const { url } = await AnimeController.PutPoster({ file, user, uuid });

  return res.status(200).json({ message: 'ok', url });
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
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

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
  if (studios !== undefined) animeService.setStudios(studios);
  if (year !== undefined) animeService.setYear(year);



  await animeService.save();

  return res.status(200).json({ message: 'ok' });
});

const PatchByUuid = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleEdit']),
  patchByUuid
];



//* ===================================== DELETE EPISODE
const deleteEpisode = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  let { dubberId, order, uuid } = req.body as AnimeDeleteEpisodeProps;

  const schema = z.object({
    uuid: z.string(),
    order: z.number(),
    dubberId: z.string()
  });

  order = +order;

  schema.parse({ dubberId, order, uuid });

  const user = await new UserService().getById(req.nekomi.user?.id ?? '', true);
  await AnimeController.DeleteEpisode({ dubberId, order, user, uuid });

  return res.status(200).json({ message: 'ok' });
});

const DeleteEpisode = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['seriesDelete']),
  deleteEpisode
];



//* ===================================== DELETE BY UUID
const deleteByUuid = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { uuid } = req.params as { uuid: string };
  const { token } = req.query as { token?: string };

  if (!token) {
    console.log(`-- INCOME DELETE ANIME REQUEST; TOKEN START --`);
    console.log(signCSRFToken());
    console.log(`-- INCOME DELETE ANIME REQUEST; TOKEN END --`);

    throw new E401(`Not authorized`);
  }
  await new MiddlewareService().checkCSRF({ token, origins: [config.DOMAIN.nekomi_core] });

  await AnimeController.DeleteByUuid({ uuid });

  return res.status(204).json({ message: 'ok' });
});

const DeleteByUuid = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['titleDelete']),
  deleteByUuid,
];



export default class AnimeRoutes {
  static GetAll = GetAll;
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