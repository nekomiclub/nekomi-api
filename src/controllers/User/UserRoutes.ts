import UserController, { IUserGetSearch } from './UserController';
import { CheckCSRF } from '~/middlewares';
import { ERR_MIDDLEWARE_REQUIRED } from '~/Services/ErrorService';
import { HTTPEndpoint } from '~/Services/HTTPService';
import { config } from '~/config';
import { parseObjectTypes } from '~/handlers/handler';
import { query } from 'express-validator';



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { q, parseInvitationStatusFor } = parseObjectTypes<IUserGetSearch>(req.query);

  const { message, status, results } = await UserController.GetSearch({ q, parseInvitationStatusFor });

  return res.status(status).json({ message, results });
});

const GetSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  query(['q']).notEmpty().isString(),
  getSearch,
];



export default class UserRoutes {
  static GetSearch = GetSearch;
}