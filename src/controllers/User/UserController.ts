import AnimeModel from '~/core/models/AnimeModel';
import DocumentDTO from '~/core/services/DTOService';
import FullkekwUser from '~/core/services/API/FullkekwUser.api';
import Search from '~/services/SearchService';
import TokenService, { TOKEN_METHOD } from '~/services/TokenService';
import UserModel from '~/core/models/UserModel';
import UserService from '~/core/services/UserService';
import multer from 'multer';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { E401, E404, ERR_ALREADY_EXIST, HTTPErrorConstructor } from '~/services/ErrorService';
import { ERROR } from '~/services/ErrorService';
import { FullkekwUser_RefreshPayload, FullkekwUser_SessionTokenPayload } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { GetCheckAccessMock, GetCheckCSRFMock } from '~/utils/jest-utils';
import { HTTPEndpoint } from '~/services/HTTPService';
import { HydrateAnimeDocument, UserMetadataMapper } from '~/utils/data-mappers';
import { Logger } from '~/services/LoggerService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { NOTIFY_EVENT, NotifyService } from '~/services/NotifyService';
import { ProductionMode, TestMode, config } from '~/config';
import { User } from '~/core/interfaces/User.intf';
import { UserGetByQuery, UserGetByQueryProps, UserGetSearch, UserGetSearchProps } from './UserControllerTypes';
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
 * Get user by query or session (*), parse capabilities or return only metadata
 * 
 * User with "*" query will session validity and return document with same user id
 * 
 * @see UserGetByQueryProps
 * @returns UserGetByQuery
 */
const getByQuery = HTTPEndpoint(async (req, res) => {
  const { metadataOnly, parseCapabilities } = parseObjectTypes<UserGetByQueryProps>(req.query);
  const CSRFToken = req.headers[config.vars.csrfHeader.toLowerCase()] as string | undefined;
  const SessionCookie = req.cookies[config.vars.sessionCookie];

  let { query } = parseObjectTypes<UserGetByQueryProps>(req.params);
  let { detailed, parseLibId } = parseObjectTypes<UserGetByQueryProps>(req.query);



  if (detailed) {
    if (!CSRFToken) throw new E401;

    await new MiddlewareService().checkCSRF({
      token: CSRFToken,
      origins: [config.DOMAIN.nekomi],
      mock: TestMode ? GetCheckCSRFMock(req) : undefined
    });
  }

  // Parse query from session
  if (query === '*') {
    if (!SessionCookie) throw new E401;

    // Verify session
    try {
      await new MiddlewareService().checkAccess({ token: SessionCookie, mock: TestMode ? GetCheckAccessMock(req) : undefined });
    } catch (e) {
      if (e instanceof HTTPErrorConstructor && e.code === ERROR.AUTH_SESSION_EXPIRED) {
        res.clearCookie(config.vars.sessionCookie);
      }

      throw e;
    }

    if (!TestMode) {
      query = TokenService.decode<FullkekwUser_SessionTokenPayload>(SessionCookie).payload?.userId ?? query;
    } else {
      query = GetCheckAccessMock(req).id;
    }
  }

  let user = await new UserService().getByQuery(query, true);

  let metadata: UserGetByQuery['metadata'] | undefined = undefined;
  let parsedLib: UserGetByQuery['parsedLib'] | undefined = undefined;
  let capabilities: UserGetByQuery['capabilities'] | undefined = undefined;



  if (metadataOnly) metadata = UserMetadataMapper(user);

  if (!metadataOnly) {
    if (parseCapabilities) capabilities = await parseRoles(user.roles);

    if (parseLibId) {
      const lib = user.libs.find(el => el.id === parseLibId);
      if (!lib) throw new E404(`Lib with id (${parseLibId}) is not found`);

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

        userService.fixLibAnimeDocuments(lib.id);
      }
    }
  }

  user = DocumentDTO.user(user, detailed);

  // @ts-expect-error Hide user when metadata only
  if (metadataOnly) user = undefined;

  const body: UserGetByQuery = {
    user,
    metadata,
    capabilities,
    parsedLib
  };

  return res.status(200).json({ message: 'ok', ...body });
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
  // const { id } = req.nekomi.user!;
  // const { method } = req.body as UserPatchProps;



  // const user = (await UserModel.findOne({ id }))!;

  // const patcher = new UserServiceOld({ user });
  // const HANDLERS: { [type in UserPatchMethodType]: () => Promise<void> } = {
  //   editFolderItem,
  //   patchWatchProgress,
  //   upload_banner,
  //   removeWatchProgress,
  // };

  // const handler = HANDLERS[method];
  // if (!handler) throw new ERR_INVALID_PAYLOAD(`Method ${method} is invalid`);

  // await handler();
  // await patcher.save();



  // return res.status(200).json({ message: 'User modified', stack: patcher.stack.join('\n') });



  // async function editFolderItem() {
  //   const { folderId, titleId } = req.body as UserPatchProps;
  //   if (!folderId || !titleId) throw new ERR_INVALID_PAYLOAD();

  //   const lib = patcher.user.libs.find(el => el.id === folderId);
  //   if (!lib) throw new E404(`Lib ${folderId} is not found`);

  //   const anime = await new AnimeService().getById(titleId, true);

  //   if (!lib.titles.includes(titleId)) {
  //     // Add title & event
  //     await patcher.addToLib({ libID: folderId, titleID: titleId });

  //     if (lib.type === 'watching') await patcher.addSubscribe({ event: NOTIFY_EVENT.NEW_EPISODE, key: titleId });

  //     // Add airing_started subscribe if there is no episodes in title and status is announcement or ongoing
  //     if (
  //       lib.type === 'plans' &&
  //       anime.episodes.length === 0 &&
  //       (anime.status === ANIME_STATUS.NOT_YET_AIRED || anime.status === ANIME_STATUS.CURRENTLY_AIRING)
  //     ) await patcher.addSubscribe({ event: NOTIFY_EVENT.AIRING_STARTED, key: titleId });
  //   } else {
  //     // Remove title & event
  //     await patcher.removeFromLib({ libID: folderId, titleID: titleId });

  //     if (lib.type === 'watching') await patcher.removeSubscribe({ event: NOTIFY_EVENT.NEW_EPISODE, key: titleId });
  //     if (lib.type === 'plans') await patcher.removeSubscribe({ event: NOTIFY_EVENT.AIRING_STARTED, key: titleId });
  //   }
  // }

  // async function patchWatchProgress() {
  //   const { progress, titleId, episodeOrder, dubberID, viewtime } = req.body as UserPatchProps;

  //   if (!titleId || !dubberID || viewtime === undefined || progress === undefined || episodeOrder === undefined) throw new ERR_INVALID_PAYLOAD();
  //   if (isNaN(+viewtime) || isNaN(+episodeOrder) || isNaN(+progress)) throw new ERR_TYPE_INVALID('Viewtime, episodeOrder and progress can not be NaN');

  //   await patcher.patchWatchProgress({ dubberID, titleID: titleId, episodeOrder, progress, updatedAt: 0 });
  //   await patcher.patchStatistics({ viewtime });
  // }

  // async function upload_banner() {
  //   const file = req.file;
  //   if (!file) throw new ERR_TYPE_INVALID(`File is not provided`);

  //   await patcher.uploadBanner({ file });
  // }

  // async function removeWatchProgress() {
  //   const { titleId } = req.body as { titleId: string };
  //   if (!titleId) throw new ERR_INVALID_PAYLOAD();

  //   await patcher.removeWatchProgress({ animeId: titleId });
  // }
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const PatchUser = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  body('method').notEmpty(),
  upload.single('file'),
  patchUser,
];



export default class UserController {
  static GetSearch = GetSearch;
  static GetByQuery = GetByQuery;
  static GetLogout = GetLogout;
  static GetLinkTelegramToken = GetLinkTelegramToken;

  static PostSignin = PostSignin;
  static PostLinkTelegram = PostLinkTelegram;
  static PostLinkTelegramTokenVerify = PostLinkTelegramTokenVerify;

  static PatchUser = PatchUser;
}