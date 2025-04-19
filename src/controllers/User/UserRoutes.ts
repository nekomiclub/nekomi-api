import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import DubberModel from '~/core/models/DubberModel';
import Search from '~/services/SearchService';
import UserModel from '~/core/models/UserModel';
import UserService from '~/core/services/UserService';
import { CheckAccess, CheckCSRF } from '~/middlewares';
import { DocumentDTO, MongoDocumentDTO } from '~/core/services/DTO';
import { DubberCompactMapper, HydrateAnimeDocument, UserMetadataMapper } from '~/utils/data-mappers';
import { E404, ERR_MISSING_AUTHORIZATION } from '~/services/ErrorService';
import { GetCheckCSRFMock } from '~/utils/testing';
import { HTTPEndpoint } from '~/services/HTTPService';
import { IUser } from '~/core/interfaces/UserIntf';
import { MiddlewareService } from '~/services/MiddlewareService';
import { NotifyService } from '~/services/NotifyService';
import { TestMode, config } from '~/config';
import { UserGetByQuery, UserGetByQueryProps, UserGetSearch, UserGetSearchProps, UserPatchProps } from './UserControllerTypes';
import { decodeToken } from '~/services/TokenService';
import { parseObjectTypes } from '~/utils/parse-object-types';
import { parseRoles } from '~/models/Role';
import { query } from 'express-validator';



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



//* ===================================== PATCH
const patchUser = HTTPEndpoint(async (req, res) => {
  const user = req.nekomi.user!;
  const { watchProgress, deleteWatchProgress } = req.body as UserPatchProps;

  let { id } = req.params as { id?: string };

  id = id ?? user.id;



  const userService = new UserService();
  await userService.init(id);

  if (watchProgress) await userService.patchWatchProgress(watchProgress);
  if (deleteWatchProgress) await userService.deleteWatchProgress({ animeId: deleteWatchProgress });

  await userService.save();



  return res.status(200).json({ message: 'User patched' });
}, {
  requireMiddlewares: ['checkAccess', 'checkCSRF']
});

const PatchUser = [
  CheckCSRF([config.DOMAIN.nekomi]),
  CheckAccess(['basic']),

  patchUser,
];




export default class UserRoutes {
  static GetSearch = GetSearch;
  static GetByQuery = GetByQuery;

  static PatchUser = PatchUser;
}