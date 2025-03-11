import AnimeController, { AnimeGetByQueryProps, AnimeGetSearchProps } from './AnimeController';
import { CheckCSRF } from '~/middlewares';
import { ERR_MIDDLEWARE_REQUIRED, ERR_MISSING_AUTHORIZATION } from '~/services/ErrorService';
import { GetCheckCSRFMock } from '~/utils/testing';
import { HTTPEndpoint } from '~/services/HTTPService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { TestMode, config } from '~/config';
import { param, query } from 'express-validator';
import { parseObjectTypes } from '~/utils/parse-object-types';



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
  query(['q']).notEmpty().isString(),
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




export default class AnimeRoutes {
  static GetSearch = GetSearch;
  static GetAll = GetAll;
  static GetByQuery = GetByQuery;
}