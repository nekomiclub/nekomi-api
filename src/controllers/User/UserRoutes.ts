import UserController from './UserController';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { ERR_MIDDLEWARE_REQUIRED, ERR_MISSING_AUTHORIZATION } from '~/services/ErrorService';
import { GetCheckCSRFMock } from '~/utils/testing';
import { HTTPEndpoint } from '~/services/HTTPService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { TestMode, config } from '~/config';
import { UserGetByQueryProps, UserGetLibProps, UserGetSearchProps, UserGetTogetherRoomProps, UserPatchProps } from './UserControllerTypes';
import { decodeToken } from '~/services/TokenService';
import { parseObjectTypes } from '~/utils/parse-object-types';
import { query } from 'express-validator';



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { q, parseInvitationStatusFor } = parseObjectTypes<UserGetSearchProps>(req.query);

  const data = await UserController.GetSearch({ q, parseInvitationStatusFor });

  return res.status(200).json({ message: 'ok', results: data });
});

const GetSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  query(['q']).notEmpty(),
  getSearch,
];



//* ===================================== GET BY QUERY
const getByQuery = HTTPEndpoint(async (req, res) => {
  const { metadataOnly, parseCapabilities } = parseObjectTypes<UserGetByQueryProps>(req.query);
  const CSRFToken = req.headers[config.vars.csrfHeader.toLowerCase()] as string | undefined;
  const SessionCookie = req.cookies[config.vars.sessionCookie];

  let { query } = parseObjectTypes<UserGetByQueryProps>(req.params);
  let { detailed } = parseObjectTypes<UserGetByQueryProps>(req.query);

  if (detailed) {
    if (!CSRFToken) throw new ERR_MISSING_AUTHORIZATION;

    await new MiddlewareService().checkCSRF({
      token: CSRFToken,
      origins: [config.DOMAIN.nekomi],
      mock: TestMode ? GetCheckCSRFMock(req) : undefined
    });
  }

  // Parse query from session
  if (query === '*') {
    if (!SessionCookie) throw new ERR_MISSING_AUTHORIZATION;

    query = decodeToken(SessionCookie).payload?.userId ?? query;
  }

  const data = await UserController.GetByQuery({ query, detailed, metadataOnly, parseCapabilities });

  return res.status(200).json({ message: 'ok', ...data });
});

const GetByQuery = [
  getByQuery
];



//* ===================================== GET LIB
const getLib = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { query, libId } = parseObjectTypes<UserGetLibProps>(req.params);

  const data = await UserController.GetLib({ query, libId });

  return res.status(200).json({ message: 'ok', results: data });
});

const GetLib = [
  CheckCSRF([config.DOMAIN.nekomi]),
  getLib,
];



//* ===================================== GET TOGETHER ROOM
const getTogetherRoom = HTTPEndpoint(async (req, res) => {
  if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

  const { query, roomId } = parseObjectTypes<UserGetTogetherRoomProps>(req.params);

  const data = await UserController.GetTogetherRoom({ query, roomId });

  return res.status(200).json({ message: 'ok', ...data });
});

const GetTogetherRoom = [
  CheckCSRF([config.DOMAIN.nekomi]),
  getTogetherRoom,
];



//* ===================================== PATCH
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
  static GetByQuery = GetByQuery;
  static GetLib = GetLib;
  static GetTogetherRoom = GetTogetherRoom;

  static PatchUser = PatchUser;
}