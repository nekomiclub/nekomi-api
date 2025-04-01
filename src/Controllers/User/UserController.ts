import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import DubberModel from '~/core/models/DubberModel';
import Search from '~/services/SearchService';
import UserModel from '~/core/models/UserModel';
import UserService from '~/core/services/UserService';
import { DocumentDTO, MongoDocumentDTO } from '~/core/services/DTO';
import { DubberCompactMapper, HydrateAnimeDocument, UserMetadataMapper } from '~/utils/data-mappers';
import { E404 } from '~/services/ErrorService';
import { IUser } from '~/core/interfaces/UserIntf';
import { NotifyService } from '~/services/NotifyService';
import { UserGetByQuery, UserGetByQueryProps, UserGetSearch, UserGetSearchProps, UserPatchProps } from './UserControllerTypes';
import { parseRoles } from '~/models/Role';



//* ===================================== GET SEARCH
async function GetSearch({ q, parseInvitationStatusFor }: UserGetSearchProps): Promise<UserGetSearch[]> {
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

  return results;
}



//* ===================================== GET BY QUERY
/**
 * Get user by query or session (*), parse capabilities or return only metadata
 * 
 * @see UserGetByQueryProps
 * @returns UserGetByQuery
 */
async function GetByQuery({ query, metadataOnly, parseCapabilities, detailed, parseLibId, parseTogetherRoomId }: UserGetByQueryProps): Promise<UserGetByQuery> {
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



  return {
    user,

    metadata,
    capabilities,
    parsedLib,
    parsedTogetherRoom
  };
}



//* ===================================== PATCH BY ID
/** @todo */
export async function PatchById({ id, watchProgress, deleteWatchProgress }: UserPatchProps) {
  const userService = new UserService();
  await userService.init(id);

  if (watchProgress) await userService.patchWatchProgress(watchProgress);
  if (deleteWatchProgress) await userService.deleteWatchProgress({ animeId: deleteWatchProgress });

  await userService.save();
}




export default class UserController {
  static GetSearch = GetSearch;
  static GetByQuery = GetByQuery;

  static PatchById = PatchById;
}