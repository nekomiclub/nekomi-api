import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import DubberModel from '~/core/models/DubberModel';
import FullkekwUserAPI from '~/core/services/API/FullkekwUserAPI';
import Search from '~/services/SearchService';
import UserModel from '~/core/models/UserModel';
import UserService from '~/core/services/UserService';
import multer from 'multer';
import { ANIME_STATUS } from '~/core/interfaces/Anime.intf';
import { AxiosError } from 'axios';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { DocumentDTO, MongoDocumentDTO } from '~/core/services/DTO';
import { DubberCompactMapper, HydrateAnimeDocument, UserMetadataMapper } from '~/utils/data-mappers';
import { E404, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_MISSING_AUTHORIZATION, ERR_TYPE_INVALID } from '~/services/ErrorService';
import { FullkekwUserAPI_TokenData } from '~/core/interfaces/API/FullkekwUserAPI.intf';
import { GetCheckCSRFMock } from '~/utils/testing';
import { HTTPEndpoint } from '~/services/HTTPService';
import { IUser } from '~/core/interfaces/User.intf';
import { Logger } from '~/services/LoggerService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { NotifyService } from '~/services/NotifyService';
import { ProductionMode, TestMode, config } from '~/config';
import { TokenService, decodeToken } from '~/services/TokenService';
import { UserGetByQuery, UserGetByQueryProps, UserGetSearch, UserGetSearchProps, UserPatchMethodType, UserPatchProps } from './UserControllerTypes';
import { UserService as UserServiceOld } from '~/models/User';
import { body, query } from 'express-validator';
import { getMockData } from '~/utils/deprecated-utils';
import { parseObjectTypes } from '~/utils/parse-object-types';
import { parseRoles } from '~/models/Role';



const upload = multer();



//* ===================================== GET SEARCH
const getSearch = HTTPEndpoint(async (req, res) => {
  const { q, parseInvitationStatusFor } = parseObjectTypes<UserGetSearchProps>(req.query);



  const limit = 15;

  let userResults: IUser[] = [];

  if (q === '~all') {
    // Get all
    userResults = (await UserModel.find()).slice(0, limit).map(el => new MongoDocumentDTO().user({ document: el, details: true }));
  } else {
    userResults = Search.search({ query: q, engine: 'user', limit });
  }

  const results: UserGetSearch[] = [];

  userResults.forEach(user => {
    let invitationStatus: UserGetSearch['invitationStatus'] = undefined;

    // Parse invitation status
    if (parseInvitationStatusFor) {
      const isTelegramNotLinked = !user.statistics.isTelegramLinked;
      const isInvitePending = user.subscribes.includes(NotifyService.createEvent({ event: 'dubber_invite_pending', key: parseInvitationStatusFor }));
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
      user: new DocumentDTO().user({ object: user }),
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
 * @see UserGetByQueryProps
 * @returns UserGetByQuery
 */
const getByQuery = HTTPEndpoint(async (req, res) => {
  const { metadataOnly, parseCapabilities } = parseObjectTypes<UserGetByQueryProps>(req.query);
  const CSRFToken = req.headers[config.vars.csrfHeader.toLowerCase()] as string | undefined;
  const SessionCookie = req.cookies[config.vars.sessionCookie];

  let { query } = parseObjectTypes<UserGetByQueryProps>(req.params);
  let { detailed, parseLibId, parseTogetherRoomId } = parseObjectTypes<UserGetByQueryProps>(req.query);

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

  let user = await new UserService().getByQuery(query, true);

  let metadata: UserGetByQuery['metadata'] | undefined = undefined;
  let parsedLib: UserGetByQuery['parsedLib'] | undefined = undefined;
  let parsedTogetherRoom: UserGetByQuery['parsedTogetherRoom'] | undefined = undefined;
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
        )).map(document => HydrateAnimeDocument(new MongoDocumentDTO().anime({ document })));
      }

      // Check if every anime listed in user lib exist
      if (lib.titles.length !== parsedLib.length) {
        const userService = new UserService();
        await userService.init(user.id);

        userService.fixLibAnimeDocuments(lib.id);
      }
    }

    if (parseTogetherRoomId) {
      const room = user.togetherRooms.find(el => el.id === parseTogetherRoomId);
      if (!room) throw new E404(`Together room with id (${parseTogetherRoomId}) is not found`);

      const anime = await new AnimeService().getById(room.titleId, true);
      const dubbers = anime.episodes.length > 0 ? (await DubberModel.find({
        id: {
          $in: [...new Set(anime.episodes.map(el => el.dubberID))]
        }
      })).map(el => new MongoDocumentDTO().dubber({ document: el })) : [];

      parsedTogetherRoom = {
        anime: HydrateAnimeDocument(anime),
        dubbers: dubbers.map(el => DubberCompactMapper(el))
      };
    }
  }

  user = new DocumentDTO().user({ object: user, details: detailed });

  // @ts-expect-error Hide user when metadata only
  if (metadataOnly) user = undefined;

  const body: UserGetByQuery = {
    user,
    metadata,
    capabilities,
    parsedLib,
    parsedTogetherRoom
  };

  return res.status(200).json({ message: 'ok', ...body });
});

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



//* ===================================== GET VALIDATE
const getValidate = HTTPEndpoint(async (req, res) => {
  const token = req.cookies[config.vars.sessionCookie];
  if (!token) return res.status(202).json({ message: 'Session not provided' });

  // @ts-expect-error Need empty object
  const session: FullkekwUserAPI_TokenData = {};

  try {
    if (!TestMode) {
      // Sync nekomi data with fullkekw user api
      const data = await FullkekwUserAPI.refreshAuth({ sessionCookie: token });

      session.id = data.id;
      session.avatar = data.avatar;
      session.username = data.username;
    } else {
      const { data } = getMockData(req, 'FkUsapiAuthRefresh');

      session.id = data.id;
      session.avatar = data.avatar;
      session.username = data.username;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      if (e.code === 'ECONNREFUSED') throw e;

      return res.status(401).clearCookie(config.vars.sessionCookie).json({ message: 'Session expired' });
    } else {
      throw e;
    }
  }

  const user = await UserModel.findOne({ id: session.id });
  if (!user) throw new E404(`User ${session.id} is not found. Create new nekomi account`);

  const patch = new UserServiceOld({ user });

  if (user.username !== session.username) await patch.patchUsername({ username: session.username, bypassValidation: true });
  if (user.avatar !== session.avatar) await patch.patchAvatar({ url: session.avatar });

  await patch.save();

  return res.status(200).json({ message: 'Session continued' });
}, {
  requireMiddlewares: ['checkCSRF']
});

const GetValidate = [
  CheckCSRF([config.DOMAIN.nekomi]),
  getValidate
];



//* ===================================== GET LINK TELEGRAM TOKEN
const getLinkTelegramToken = HTTPEndpoint(async (req, res) => {
  const user = (await UserModel.findOne({ id: req.nekomi.user?.id }))!;
  if (user.statistics.isTelegramLinked) throw new ERR_ALREADY_EXIST('Account already linked');

  const patch = new UserServiceOld({ user });
  const token = TokenService.signToken('TelegramLink');

  await patch.patchTelegramLinkToken({ token });
  await patch.save();

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
  const { session } = req.body as { session: string };

  // @ts-expect-error Need empty object
  const DATA: FullkekwUserAPI_TokenData = {};



  // Validate session
  if (!TestMode) {
    const data = await FullkekwUserAPI.refreshAuth({ sessionCookie: session });

    DATA.id = data.id;
    DATA.avatar = data.avatar;
    DATA.username = data.username;
  } else {
    const { data } = getMockData<FullkekwUserAPI_TokenData>(req, 'FkUsapiAuthRefresh');

    DATA.id = data.id;
    DATA.avatar = data.avatar;
    DATA.username = data.username;
  }

  let user = await UserModel.findOne({ id: DATA.id });
  let isUserNew = false;

  if (user) {
    // Sync nekomi data with fullkekw user api
    const patch = new UserServiceOld({ user });

    if (user.username !== DATA.username) { await patch.patchUsername({ username: DATA.username, bypassValidation: true }); await patch.save(); }
    if (user.avatar !== DATA.avatar) { await patch.patchAvatar({ url: DATA.avatar }); await patch.save(); }

    isUserNew = false;
  } else {
    // User is not found, create new
    Logger.info(`[UserController]: New user signed in, welcome!`);

    user = await UserServiceOld.create(DATA);
    isUserNew = true;
    Search.update('user');
  }



  return res.status(isUserNew ? 201 : 200).cookie(config.vars.sessionCookie, session, {
    httpOnly: true,
    maxAge: config.vars.sessionCookieExpireOffset,
    domain: ProductionMode ? `.${config.DOMAIN.nekomi}` : undefined
  }).json({
    message: 'User signed in',
    id: DATA.id,
    username: DATA.username,
    avatar: DATA.avatar
  });
}, {
  requireMiddlewares: ['checkCSRF']
});

const PostSignin = [
  CheckCSRF([config.DOMAIN.nekomi]),
  body('session').notEmpty(),
  postSignin
];



//* ===================================== POST LINK TELEGRAM
const postLinkTelegram = HTTPEndpoint(async (req, res) => {
  const { animeeID, telegramID } = req.body as { animeeID: string, telegramID: number };

  const user = await UserModel.findOne({ id: animeeID });
  if (!user) throw new E404(`User ${animeeID} is not found`);

  const userWithThisTelegramID = await UserModel.findOne({ 'telegramData.id': telegramID });
  if (user.statistics.isTelegramLinked || userWithThisTelegramID) throw new ERR_ALREADY_EXIST('This Telegram ID already linked');

  const patch = new UserServiceOld({ user });

  await patch.patchStatistics({ isTelegramLinked: true });
  await patch.patchTelegramData({ id: telegramID });
  await patch.save();

  Logger.info(`[UserController]: User ${animeeID} linked telegram with id ${telegramID}`);

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

  const patch = new UserServiceOld({ user });

  await patch.patchTelegramLinkToken({ token: null });
  await patch.save();

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



//* ===================================== POST CREATE TOGETRHER ROOM
const postCreateTogetherRoom = HTTPEndpoint(async (req, res) => {
  const userId = req.nekomi.user?.id;
  const { titleId } = req.body as { titleId: string };

  const user = await UserModel.findOne({ id: userId });
  if (!user) throw new E404(`User ${userId} is not found`);

  const userService = new UserServiceOld({ user });

  const togetherRoomId = await userService.createTogetherRoom({ titleId });
  await userService.save();

  return res.status(200).json({ message: 'New together room created', id: togetherRoomId });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const PostCreateTogetherRoom = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  body('titleId').notEmpty(),
  postCreateTogetherRoom
];



//* ===================================== PATCH USER
const patchUser = HTTPEndpoint(async (req, res) => {
  const { id } = req.nekomi.user!;
  const { method } = req.body as UserPatchProps;



  const user = (await UserModel.findOne({ id }))!;

  const patcher = new UserServiceOld({ user });
  const HANDLERS: { [type in UserPatchMethodType]: () => Promise<void> } = {
    editFolderItem,
    patchWatchProgress,
    upload_banner,
    removeWatchProgress,
  };

  const handler = HANDLERS[method];
  if (!handler) throw new ERR_INVALID_PAYLOAD(`Method ${method} is invalid`);

  await handler();
  await patcher.save();



  return res.status(200).json({ message: 'User modified', stack: patcher.stack.join('\n') });



  async function editFolderItem() {
    const { folderId, titleId } = req.body as UserPatchProps;
    if (!folderId || !titleId) throw new ERR_INVALID_PAYLOAD();

    const lib = patcher.user.libs.find(el => el.id === folderId);
    if (!lib) throw new E404(`Lib ${folderId} is not found`);

    const anime = await new AnimeService().getById(titleId, true);

    if (!lib.titles.includes(titleId)) {
      // Add title & event
      await patcher.addToLib({ libID: folderId, titleID: titleId });

      if (lib.type === 'watching') await patcher.addSubscribe({ event: 'new_episode', key: titleId });

      // Add airing_started subscribe if there is no episodes in title and status is announcement or ongoing
      if (
        lib.type === 'plans' &&
        anime.episodes.length === 0 &&
        (anime.status === ANIME_STATUS.NOT_YET_AIRED || anime.status === ANIME_STATUS.CURRENTLY_AIRING)
      ) await patcher.addSubscribe({ event: 'airing_started', key: titleId });
    } else {
      // Remove title & event
      await patcher.removeFromLib({ libID: folderId, titleID: titleId });

      if (lib.type === 'watching') await patcher.removeSubscribe({ event: 'new_episode', key: titleId });
      if (lib.type === 'plans') await patcher.removeSubscribe({ event: 'airing_started', key: titleId });
    }
  }

  async function patchWatchProgress() {
    const { progress, titleId, episodeOrder, dubberID, viewtime } = req.body as UserPatchProps;

    if (!titleId || !dubberID || viewtime === undefined || progress === undefined || episodeOrder === undefined) throw new ERR_INVALID_PAYLOAD();
    if (isNaN(+viewtime) || isNaN(+episodeOrder) || isNaN(+progress)) throw new ERR_TYPE_INVALID('Viewtime, episodeOrder and progress can not be NaN');

    await patcher.patchWatchProgress({ dubberID, titleID: titleId, episodeOrder, progress, updatedAt: 0 });
    await patcher.patchStatistics({ viewtime });
  }

  async function upload_banner() {
    const file = req.file;
    if (!file) throw new ERR_TYPE_INVALID(`File is not provided`);

    await patcher.uploadBanner({ file });
  }

  async function removeWatchProgress() {
    const { titleId } = req.body as { titleId: string };
    if (!titleId) throw new ERR_INVALID_PAYLOAD();

    await patcher.removeWatchProgress({ animeId: titleId });
  }
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



//* ===================================== DELETE TOGETHER ROOM
const deleteTogetherRoom = HTTPEndpoint(async (req, res) => {
  const userId = req.nekomi.user?.id;
  const { id } = req.params as { id: string };

  const user = await UserModel.findOne({ id: userId });
  if (!user) throw new E404(`User ${userId} is not found`);

  const userService = new UserServiceOld({ user });

  await userService.removeTogetherRoom({ id });
  await userService.save();

  return res.status(200).json({ message: 'Together room deleted' });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const DeleteTogetherRoom = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),
  deleteTogetherRoom,
];




export default class UserController {
  static GetSearch = GetSearch;
  static GetByQuery = GetByQuery;
  static GetLogout = GetLogout;
  static GetValidate = GetValidate;
  static GetLinkTelegramToken = GetLinkTelegramToken;

  static PostSignin = PostSignin;
  static PostLinkTelegram = PostLinkTelegram;
  static PostLinkTelegramTokenVerify = PostLinkTelegramTokenVerify;
  static PostCreateTogetherRoom = PostCreateTogetherRoom;

  static PatchUser = PatchUser;

  static DeleteTogetherRoom = DeleteTogetherRoom;
}