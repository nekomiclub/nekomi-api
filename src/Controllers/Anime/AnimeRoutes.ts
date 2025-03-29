import AnimeController from './AnimeController';
import UserService from '~/core/services/UserService';
import createID from '~/utils/create-id';
import multer from 'multer';
import { AnimeGetByQueryProps, AnimeGetSearchProps, AnimePutPosterProps } from './AnimeControllerTypes';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { ERR_INVALID_PAYLOAD, ERR_MIDDLEWARE_REQUIRED, ERR_MISSING_AUTHORIZATION } from '~/services/ErrorService';
import { GetCheckCSRFMock } from '~/utils/testing';
import { HTTPEndpoint } from '~/services/HTTPService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { TestMode, config } from '~/config';
import { body, param, query } from 'express-validator';
import { parseObjectTypes } from '~/utils/parse-object-types';



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



//* ===================================== PUT POSTER
const putPoster = HTTPEndpoint(async (req, res) => {
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



//* ===================================== DELETE BY UUID
const deleteByUuid = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { uuid } = req.params as { uuid: string };

  await AnimeController.DeleteByUuid({ uuid });

  return res.status(204).json({ message: 'ok' });
});

/** @tested 2.1.0 */
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

  static PutPoster = PutPoster;

  static DeleteByUuid = DeleteByUuid;
}