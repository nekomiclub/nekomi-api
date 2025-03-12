import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import Search from '~/services/SearchService';
import UserModel from '~/core/models/UserModel';
import UserService from '~/core/services/UserService';
import { DocumentDTO, MongoDocumentDTO } from '~/core/services/DTO';
import { E404 } from '~/services/ErrorService';
import { HydrateAnimeDocument } from '~/utils/hydrate-document';
import { HydratedAnime } from '~/core/interfaces/AnimeIntf';
import { IUser } from '~/core/interfaces/UserIntf';
import { Metadata } from '~/core/interfaces/types';
import { NotifyService } from '~/services/NotifyService';
import { TRoleCapability } from '~/core/interfaces/RoleIntf';
import { UserGetByQuery, UserGetByQueryProps, UserGetLib, UserGetLibProps, UserGetSearch, UserGetSearchProps, UserGetTogetherRoom, UserGetTogetherRoomProps, UserPatchProps } from './UserControllerTypes';
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
async function GetByQuery({ query, metadataOnly, parseCapabilities, detailed }: UserGetByQueryProps): Promise<UserGetByQuery> {
  let user = await new UserService().getByQuery(query, true);

  let metadata: Metadata | undefined = undefined;
  let capabilities: TRoleCapability[] | undefined = undefined;



  if (metadataOnly) metadata = {
    title: `@${user.username}`,
    description: `Профіль користувача`,
    keywords: [user.username],
    photo: user.avatar
  };

  if (!metadataOnly && parseCapabilities) capabilities = await parseRoles(user.roles);

  user = new DocumentDTO().user({ object: user, details: detailed });



  return {
    user: metadataOnly ? undefined : user,

    metadata,
    capabilities,
  };
}



//* ===================================== GET LIB
/**
 * Get user lib animes
 * 
 * @see UserGetLibProps
 * @returns UserGetLib
 */
async function GetLib({ query, libId }: UserGetLibProps): Promise<UserGetLib> {
  const user = await new UserService().getByQuery(query, true);
  const lib = user.libs.find(el => el.id === libId);
  if (!lib) throw new E404(`Lib with id (${libId}) is not found`);

  let animes: HydratedAnime[] = [];

  if (lib.titles.length) {
    animes = (await AnimeModel.find(
      { uuid: { $in: lib.titles } }
    )).map(document => HydrateAnimeDocument(new MongoDocumentDTO().anime({ document })));
  }

  return {
    results: animes
  };
}



//* ===================================== GET TOGETHER ROOM
/**
 * Get user watch together room
 * 
 * @see UserGetTogetherRoomProps
 * @returns UserGetTogetherRoom
 */
async function GetTogetherRoom({ query, roomId }: UserGetTogetherRoomProps): Promise<UserGetTogetherRoom> {
  const user = await new UserService().getByQuery(query, true);
  const room = user.togetherRooms.find(el => el.id === roomId);
  if (!room) throw new E404(`Together room with id (${roomId}) is not found`);

  const anime = await new AnimeService().getById(room.titleId);

  return {
    room,
    anime: HydrateAnimeDocument(anime)
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
  static GetLib = GetLib;
  static GetTogetherRoom = GetTogetherRoom;

  static PatchById = PatchById;
}