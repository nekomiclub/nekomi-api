import AnimeController, { AnimeGetByQueryProps, AnimeGetSearch } from './AnimeController';
import { CheckCSRF } from '~/middlewares';
import { ERR_MIDDLEWARE_REQUIRED } from '~/services/ErrorService';
import { HTTPEndpoint } from '~/services/HTTPService';
import { config } from '~/config';
import { param, query } from 'express-validator';
import { parseObjectTypes } from '~/utils/parse-object-types';



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { q } = parseObjectTypes<AnimeGetSearch>(req.query);

  const { message, status, results } = await AnimeController.GetSearch({ q });

  return res.status(status).json({ message, results });
});

const GetSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  query(['q']).notEmpty().isString(),
  getSearch,
];

//* ===================================== GET ALL
const getAll = HTTPEndpoint(async (req, res) => {
  const data = await AnimeController.GetAll();

  return res.status(200).json({ message: 'ok', ...data });
});

const GetAll = [
  getAll,
];

//* ===================================== GET BY QUERY
const getByQuery = HTTPEndpoint(async (req, res) => {
  const { query } = parseObjectTypes<AnimeGetByQueryProps>(req.params);
  const { metadataOnly, detailed, fetchDubbers, fetchRelated } = parseObjectTypes<AnimeGetByQueryProps>(req.query);
  const CSRF_Token = req.headers[config.vars.csrfHeader.toLowerCase()] as string | undefined;


  const data = await AnimeController.GetByQuery({ query, detailed, metadataOnly, CSRF_Token, fetchDubbers, fetchRelated });

  return res.status(200).json({ message: 'ok', ...data });
});

const GetByQuery = [
  param('query').notEmpty(),
  getByQuery,
];




export default class AnimeRoutes {
  static GetSearch = GetSearch;
  static GetAll = GetAll;
  static GetByQuery = GetByQuery;
}