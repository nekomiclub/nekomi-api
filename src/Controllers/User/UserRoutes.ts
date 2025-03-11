import UserController, { IUserGetSearch, UserPatchProps } from './UserController';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { ERR_MIDDLEWARE_REQUIRED } from '~/services/ErrorService';
import { HTTPEndpoint } from '~/services/HTTPService';
import { config } from '~/config';
import { parseObjectTypes } from '~/utils/parse-object-types';
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



//* ===================================== PATCH USER
const patchUser = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);
  if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);

  const user = req.nekomi.user!;
  const { watchProgress, deleteWatchProgress } = req.body as UserPatchProps;

  let { id } = req.params as { id?: string };

  id = id ?? user.id;

  await UserController.PatchById({ id, watchProgress, deleteWatchProgress });

  return res.status(200).json({ message: 'User patched' });
});

const PatchUser = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),

  patchUser,
];




export default class UserRoutes {
  static GetSearch = GetSearch;
  static PatchUser = PatchUser;
}