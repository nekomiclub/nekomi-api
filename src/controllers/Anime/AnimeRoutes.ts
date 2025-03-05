import AnimeController, { IAnimeGetSearch } from './AnimeController';
import { CheckCSRF } from '~/middlewares';
import { ERR_MIDDLEWARE_REQUIRED } from '~/services/ErrorService';
import { HTTPEndpoint } from '~/services/HTTPService';
import { config } from '~/config';
import { parseObjectTypes } from '~/utils/parse-object-types';
import { query } from 'express-validator';



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { q } = parseObjectTypes<IAnimeGetSearch>(req.query);

  const { message, status, results } = await AnimeController.GetSearch({ q });

  return res.status(status).json({ message, results });
});

const GetSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  query(['q']).notEmpty().isString(),
  getSearch,
];



export default class AnimeRoutes {
  static GetSearch = GetSearch;
}