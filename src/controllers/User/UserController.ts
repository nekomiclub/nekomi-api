import AnimeModel from '~/core/models/AnimeModel';
import DocumentDTO from '~/core/services/DTOService';
import FullkekwUser from '~/core/services/API/FullkekwUser.api';
import Search from '~/services/SearchService';
import TokenService, { TOKEN_METHOD } from '~/services/TokenService';
import UserModel from '~/core/models/UserModel';
import UserService from '~/core/services/UserService';
import multer from 'multer';
import { CheckAccess, CheckCSRF, getCSRFToken, getSessionToken } from '~/middlewares';
import { DevelopmentMode, ProductionMode, TestMode, config } from '~/config';
import { E404, ERROR, ERR_ALREADY_EXIST, HTTPErrorConstructor } from '~/services/ErrorService';
import { ERROR_AUTH_NO_RIGHTS, ERROR_GENERIC_FILE_MISS, ERROR_USER_LIB_NOT_FOUND } from '~/services/Exceptions';
import { FullkekwUser_RefreshPayload, FullkekwUser_SessionTokenPayload } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { GetCheckAccessMock, GetCheckCSRFMock } from '~/utils/jest-utils';
import { HTTPEndpoint } from '~/services/HTTPService';
import { HydrateAnimeDocument } from '~/utils/data-mappers';
import { Logger } from '~/services/LoggerService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { NOTIFY_EVENT, NotifyService } from '~/services/NotifyService';
import { PutBanner, UserGetByQuery, UserGetByQuerySchema, UserGetSearch, UserGetSearchProps, UserPatchProps, UserPatchSchema } from './UserControllerTypes';
import { User } from '~/core/interfaces/User.intf';
import { body, query } from 'express-validator';
import { parseObjectTypes } from '~/utils/utils';
import { parseRoles } from '~/core/services/RoleService';



const upload = multer();



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  const { q, parseInvitationStatusFor } = parseObjectTypes<UserGetSearchProps>(req.query);



  const limit = 15;

  let userResults: User[] = [];

  if (q === '~all') {
    // Get all
    userResults = (await UserModel.find()).slice(0, limit).map(doc => DocumentDTO.user(doc));
  } else {
    userResults = Search.search({ query: q, engine: 'user', limit });
  }

  const results: UserGetSearch[] = [];

  userResults.forEach(user => {
    let invitationStatus: UserGetSearch['invitationStatus'] = undefined;

    // Parse invitation status
    if (parseInvitationStatusFor) {
      const isTelegramNotLinked = !user.statistics.isTelegramLinked;
      const isInvitePending = user.subscribes.includes(NotifyService.createEvent({ event: NOTIFY_EVENT.DUBBER_INVITE_PENDING, key: parseInvitationStatusFor }));
      const isOthersMemberAlready = user.statistics.dubber_team_member;

      if (isTelegramNotLinked) {
        invitationStatus = 'telegram_not_linked';
      } else if (isInvitePending) {
        invitationStatus = 'invite_pending';
      } else if (isOthersMemberAlready) {
        invitationStatus = 'others_member_already';
      } else {
        invitationStatus = 'can_be_invited';
      }
    }

    results.push({
      user: DocumentDTO.user(user),
      invitationStatus
    });
  });



  return res.status(200).json({ message: 'ok', results });
}, {
  requireMiddlewares: ['checkCSRF']
});

const GetSearch = [
  CheckCSRF([config.DOMAIN.nekomi]),
  query(['q']).notEmpty(),
  getSearch,
];



//* ===================================== GET BY QUERY
/**
 * Get user by query or session (query=*)
 * 
 * User with "*" query will retrieved by session id
 * Parse private lib available only for account owner or admin
 * Private user libs will be hidden from output if user neither account owner nor admin
 * 
 * @see UserGetByQueryProps
 * @returns UserGetByQuery
 */
const getByQuery = HTTPEndpoint(async (req, res) => {
  let { query } = UserGetByQuerySchema.params.parse(req.params);
  const { detailed, parseCapabilities, parseLibId } = UserGetByQuerySchema.search.parse(req.query);

  let isSessionValid = false;
  let sessionPayload: FullkekwUser_SessionTokenPayload | undefined;
  let isOwner = false;
  let isAdmin = false;



  // Detailed mode available only for CSRF allowed origins
  if (detailed) {
    await new MiddlewareService().checkCSRF({ token: getCSRFToken(req), origins: [config.DOMAIN.nekomi], mock: TestMode ? GetCheckCSRFMock(req) : undefined });
  }

  // Retrieve query from session id
  if (query === '*') {
    await validateSession();

    query = sessionPayload?.userId ?? query;
  }



  let user = await new UserService().getByQuery(query, true);

  let parsedLib: UserGetByQuery['parsedLib'];
  let capabilities: UserGetByQuery['capabilities'];



  // Parse capabilities from roles
  if (parseCapabilities) capabilities = await parseRoles(user.roles);

  // Parse lib anime documents
  if (parseLibId) {
    const lib = user.libs.find(el => el.id === parseLibId);
    if (!lib) throw new E404(`Lib with id (${parseLibId}) is not found`);

    // Verify that only account owner and admin can access hidden libs
    if (lib.settings.hidden) {
      if (!await validateOwner()) {
        // Reject access if user is neither admin not account owner 
        if (!await validateAdmin()) throw ERROR_AUTH_NO_RIGHTS;
      }
    }

    parsedLib = [];

    if (lib.titles.length) {
      parsedLib = (await AnimeModel.find(
        { uuid: { $in: lib.titles } }
      )).map(document => HydrateAnimeDocument(DocumentDTO.anime(document)));
    }

    // Check if every anime listed in user lib exist
    if (lib.titles.length !== parsedLib.length) {
      const userService = new UserService();
      await userService.init(user.id);

      userService.fixLibAnimeDocuments(lib.id); // async only
    }
  }

  // Drop private user libs
  try {
    // Check if user is account owner
    if (!await validateOwner()) {
      // Check if user is admin
      if (!await validateAdmin()) throw new Error('403');
    }
  } catch (e) {
    if (DevelopmentMode) Logger.error(`[GetUser]: An error occured while dropping private libs`, e);
    user.libs = user.libs.filter(el => !el.settings.hidden);
  }

  user = DocumentDTO.user(user, detailed);

  const body: UserGetByQuery = {
    user,
    capabilities,
    parsedLib
  };

  return res.status(200).json({ message: 'ok', ...body });



  async function validateSession(): Promise<boolean> {
    if (isSessionValid) return true;

    const session = getSessionToken(req);

    if (!TestMode) {
      sessionPayload = TokenService.decode<FullkekwUser_SessionTokenPayload>(session).payload;
    } else {
      const mock = GetCheckAccessMock(req);

      sessionPayload = {
        sessionId: '',
        timestamp: 0,
        userId: mock.id
      };
    }

    try {
      await new MiddlewareService().checkAccess({ token: session, mock: TestMode ? GetCheckAccessMock(req) : undefined });
    } catch (e) {
      // Remove nekomi cookie if session expired
      if (e instanceof HTTPErrorConstructor && e.code === ERROR.AUTH_SESSION_EXPIRED) res.clearCookie(config.vars.sessionCookie);
      throw e;
    }

    isSessionValid = true;

    return true;
  }

  async function validateOwner(): Promise<boolean> {
    if (isOwner) return true;

    await validateSession();

    isOwner = sessionPayload?.userId === user.id;

    return isOwner;
  }

  async function validateAdmin(): Promise<boolean> {
    if (isAdmin) return true;

    await validateSession();

    const sessionUser = await new UserService().init(sessionPayload?.userId ?? '');
    const sessionCapabilities = await parseRoles(sessionUser.roles);

    isAdmin = sessionCapabilities.includes('root') || sessionCapabilities.includes('admin');

    return isAdmin;
  }
});

/** @tested partially tested */
const GetByQuery = [
  getByQuery
];



//* ===================================== GET LOGOUT
const getLogout = HTTPEndpoint(async (req, res) => {
  return res.status(200).clearCookie(config.vars.sessionCookie, {
    httpOnly: true,
    domain: ProductionMode ? `.${config.DOMAIN.nekomi}` : undefined
  }).json({ message: `Logged out` });
}, {
  requireMiddlewares: ['checkCSRF']
});

const GetLogout = [
  CheckCSRF([config.DOMAIN.nekomi]),
  getLogout
];


//* ===================================== GET LINK TELEGRAM TOKEN
const getLinkTelegramToken = HTTPEndpoint(async (req, res) => {
  const userService = new UserService();
  const user = await userService.init(req.nekomi.user?.id ?? '');

  if (user.statistics.isTelegramLinked) throw new ERR_ALREADY_EXIST('Account already linked');

  const token = TokenService.sign(TOKEN_METHOD.TELEGRAM_LINK, {});

  await userService.setTelegramLinkToken(token);
  await userService.save();

  return res.status(200).json({ message: 'Telegram link token issued', token });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const GetLinkTelegramToken = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  getLinkTelegramToken
];



//* ===================================== POST SIGNIN
const postSignin = HTTPEndpoint(async (req, res) => {
  const { session: sessionToken } = req.body as { session: string };

  const userService = new UserService();

  // @ts-expect-error Need empty object
  const session: FullkekwUser_RefreshPayload = {};



  // Validate session
  if (!TestMode) {
    const data = await FullkekwUser.refreshAuth({ sessionCookie: sessionToken });

    session.id = data.id;
    session.avatar = data.avatar;
    session.username = data.username;
  } else {
    const data = GetCheckAccessMock(req);

    session.id = data.id;
    session.avatar = data.avatar;
    session.username = data.username;
  }

  const user = await userService.safeGetByQuery(session.id);

  if (!user) {
    // User not found, create new
    await userService.create({ username: session.username, avatar: session.avatar, id: session.id });

    Search.update('user');

    Logger.info(`[UserController]: New user signed in, welcome!`);
  }



  return res.status(!user ? 201 : 200).cookie(config.vars.sessionCookie, sessionToken, {
    httpOnly: true,
    maxAge: config.vars.sessionCookieExpireOffset,
    domain: ProductionMode ? `.${config.DOMAIN.nekomi}` : undefined
  }).json({
    message: 'User signed in',
    id: session.id,
    username: session.username,
    avatar: session.avatar
  });
}, {
  requireMiddlewares: ['checkCSRF']
});

/**
 * Singin user & assign nekomi session cookie
 * 
 * @requires {session: string} - session token
 * @returns {id: string, username: string, avatar: string}
 */
const PostSignin = [
  CheckCSRF([config.DOMAIN.nekomi]),
  body('session').notEmpty(),
  postSignin
];



//* ===================================== POST LINK TELEGRAM
const postLinkTelegram = HTTPEndpoint(async (req, res) => {
  const { animeeID: nekomiId, telegramID } = req.body as { animeeID: string, telegramID: number };

  const userService = new UserService();
  const user = await userService.init(nekomiId);

  const userWithThisTelegramID = await UserModel.findOne({ 'telegramData.id': telegramID });
  if (user.statistics.isTelegramLinked || userWithThisTelegramID) throw new ERR_ALREADY_EXIST('This Telegram ID already linked');

  await userService.setTelegramLinkToken(null);
  await userService.patchStatistics({ isTelegramLinked: true });
  userService.patchTelegramData({ id: telegramID });
  await userService.save();

  Logger.info(`[UserController]: User ${nekomiId} linked telegram with id ${telegramID}`);

  return res.status(200).json({ message: 'Account linked', username: user.username });
}, {
  requireMiddlewares: ['checkCSRF']
});

const PostLinkTelegram = [
  CheckCSRF([config.DOMAIN.nekomi_bot]),
  body(['animeeID', 'telegramID']).notEmpty(),
  postLinkTelegram
];



//* ===================================== POST LINK TELEGRAM TOKEN VERIFY
const postLinkTelegramTokenVerify = HTTPEndpoint(async (req, res) => {
  const { token } = req.body as { token: string };

  const user = await UserModel.findOne({ telegramLinkToken: token });
  if (!user) throw new E404('User with this telegram link token is not found');

  const userService = new UserService();
  await userService.init(user.id);

  await userService.setTelegramLinkToken(null);
  await userService.save();

  Logger.info(`[UserController]: Telegram link token verified and revoked for ${user.id}`);

  return res.status(200).json({ message: 'Token verified', verified: true, id: user.id });
}, {
  requireMiddlewares: ['checkCSRF']
});

const PostLinkTelegramTokenVerify = [
  CheckCSRF([config.DOMAIN.nekomi_bot]),
  body('token').notEmpty(),
  postLinkTelegramTokenVerify
];



//* ===================================== PATCH USER
const patchUser = HTTPEndpoint(async (req, res) => {
  UserPatchSchema.parse(req.body);

  const { id } = req.nekomi.user!;
  const { editFolderAnime, watchProgress, removeWatchProgress } = req.body as UserPatchProps;

  const userService = new UserService();
  await userService.init(id);



  if (editFolderAnime !== undefined) {
    const { animeId, libId } = editFolderAnime;

    const lib = userService.user.libs.find(el => el.id === libId);
    if (!lib) throw ERROR_USER_LIB_NOT_FOUND;

    if (lib.titles.includes(animeId)) {
      // Remove
      userService.removeFromLib(libId, animeId);
    } else {
      // Append
      await userService.appendInLib(libId, animeId);
    }
  }



  if (watchProgress !== undefined) {
    const { animeId, dubberId, episodeOrder, progress, viewtime } = watchProgress;

    await userService.patchWatchProgress({ dubberID: dubberId, titleID: animeId, episodeOrder, progress });
    await userService.patchStatistics({ increaseViewtime: viewtime });
  }



  if (removeWatchProgress !== undefined) {
    const { animeId } = removeWatchProgress;

    userService.removeWatchProgress(animeId);
  }



  await userService.save();

  return res.status(200).json({ message: 'User modified' });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const PatchUser = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  patchUser,
];



//* ===================================== PUT BANNER
const putBanner = HTTPEndpoint(async (req, res) => {
  const { id } = req.nekomi.user!;

  const file = req.file;
  if (!file) throw ERROR_GENERIC_FILE_MISS;

  const userService = new UserService();
  await userService.init(id);

  const { bannerUrl } = await userService.uploadBanner(file);

  const body: PutBanner = {
    bannerUrl
  };

  return res.status(200).json({ message: 'Banner updated', ...body });
}, { requireMiddlewares: ['checkAccess', 'checkCSRF'] });

const PutBanner = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  upload.single('file'),
  putBanner
];



const UserController = {
  GetSearch,
  GetByQuery,
  GetLogout,
  GetLinkTelegramToken,

  PostSignin,
  PostLinkTelegram,
  PostLinkTelegramTokenVerify,

  PatchUser,

  PutBanner,
};

export default UserController;