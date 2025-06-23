import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from './AnimeService';
import DocumentDTO from './DTOService';
import DubberService from './DubberService';
import NekomiUploadsAPI from './API/NekomiUploads.api';
import RoleModel from '~/core/models/RoleModel';
import User, { UserLib, UserTelegramData, UserWatchProgress } from '~/core/interfaces/User.intf';
import UserModel from '~/core/models/UserModel';
import validator from 'validator';
import { DevelopmentMode, TestMode, config } from '~/config';
import { E400, E404, ERR_NO_DOCUMENT } from '~/services/ErrorService';
import { ERROR_ROLE_NOT_FOUND, ERROR_USER_LIB_NOT_FOUND, ERROR_USER_TGDATA_ID_MISS, ERROR_USER_TGTOKEN_ASSIGNED, ERROR_USER_USERNAME_INVALID, ERROR_USER_USERNAME_OCCUPIED } from '~/services/Exceptions';
import { HydratedDocument } from 'mongoose';
import { Logger } from '~/services/LoggerService';
import { NotifyEventPayload, NotifyService } from '~/services/NotifyService';
import { ServiceControls, SinglePartial } from '~/core/interfaces/types';
import { createSlug, createStringID, createUUID } from '~/utils/utils';
import { getUTC } from '~/utils/utils';
import { trimString } from '~/utils/utils';



interface UserCreateProps {
  username: string
  avatar?: string

  /** Specifies if user was handled by fullkekw user api. Will pass some checks if true */
  byUserApi?: boolean
  DEV_ID?: string

  /** Specifies if document will be saved. @default true */
  savedoc?: boolean
}

interface UserLibFactoryProps {
  name: UserLib['settings']['name']
  type: UserLib['type']

  titles?: UserLib['titles']
  /** @see UserLib.settings.hidden */
  hidden?: UserLib['settings']['hidden']
  /** @see UserLib.settings.immortal */
  immortal?: UserLib['settings']['immortal']

  DEV_ID?: string
}

interface PatchUserStatisticProps {
  /** In seconds */
  increaseViewtime?: number

  isTelegramLinked?: boolean
  dubberTeamMember?: string | null
}



type UserModelControlsType = ServiceControls<UserCreateProps, User>
export type UserPatchWatchProgressProps = SinglePartial<{
  viewtime: number
} & UserWatchProgress, 'updatedAt'>;



export const ERR_LIB_NAME_INVALID = new E400(`Lib name must be between ${config.VALIDATION.User.MinimumLibNameLength} and ${config.VALIDATION.User.MaximumLibNameLength} symbols length`, 'user:lib_name_invalid');



class UserModelControls implements UserModelControlsType {
  async create({ username, DEV_ID, avatar, byUserApi, savedoc }: UserCreateProps): Promise<User> {
    savedoc = savedoc ?? true;
    username = createSlug(trimString(username));

    if (!byUserApi) await this._validateUsername(username);

    const id = DevelopmentMode && DEV_ID ? DEV_ID : TestMode ? `~test-${createUUID()}` : createUUID();
    avatar = avatar ?? config.vars.defaultAvatar;

    const instance: User = {
      id,
      username,
      avatar,
      banner: config.vars.defaultBanner,
      roles: ['user'],
      watchProgress: [],
      subscribes: [],
      telegramData: null,
      telegramLinkToken: null,
      statistics: {
        accountCreated: getUTC().timestamp,
        dubber_team_member: null,
        isTelegramLinked: false,
        viewtime: 0,
      },
      libs: [
        UserLibFactory({ name: 'Улюблені', type: 'favorite', hidden: true, immortal: true }),
        UserLibFactory({ name: 'Переглядаю', type: 'watching', hidden: false, immortal: true }),
        UserLibFactory({ name: 'Переглянуті', type: 'watched', hidden: false, immortal: true }),
        UserLibFactory({ name: 'В планах', type: 'plans', hidden: false, immortal: true }),
        UserLibFactory({ name: 'Відкладені', type: 'delayed', hidden: true, immortal: true }),
      ],
    };

    const document = new UserModel(instance);

    if (savedoc) {
      await document.save();
      Logger.info(`[UserService]: New document created. [id: ${id}]`);
    } else {
      Logger.warn(`[UserService]: New document created but not saved. [id: ${id}]`);
    }

    return instance;
  }

  async deleteOne(id: string): Promise<void> {
    await UserModel.deleteOne({ id });

    Logger.info(`[UserService]: Single document deleted. [id: ${id}]`);
  }

  async deleteMany(id: string): Promise<void> {
    const details = await UserModel.deleteMany({ id });

    Logger.info(`[UserService]: Multiple documents deleted. [id: ${id}; count: ${details.deletedCount}]`);
  }

  async getAll(details?: boolean): Promise<User[]> {
    const total = await UserModel.find();
    const list = total.map(document => {
      return DocumentDTO.user(document, details);
    });

    return list;
  }

  async getById(id: string, details?: boolean): Promise<User> {
    const document = await UserModel.findOne({ id });
    if (!document) throw new E404(`User with id (${id}) is not found`);

    return DocumentDTO.user(document, details);
  }

  async getByQuery(query: string, details?: boolean): Promise<User> {
    const document = await UserModel.findOne({ $or: [{ id: query }, { username: query }] });
    if (!document) throw new E404(`User with query (${query}) is not found`);

    return DocumentDTO.user(document, details);
  }

  async safeGetByQuery(query: string, details?: boolean): Promise<User | null> {
    try {
      return await this.getByQuery(query, details);
    } catch (e) { return null; }
  }



  /** 
   * Validate username
   * Check if username unique
   */
  protected async _validateUsername(username: string) {
    if (!validator.isLength(username, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERROR_USER_USERNAME_INVALID;

    const exist = await this.safeGetByQuery(username);
    if (exist) throw ERROR_USER_USERNAME_OCCUPIED;
  }
}



/** 
 * Brand-new implementation of database services
 * This service must be initialized by calling @method init()
*/
export class UserService extends UserModelControls {
  /** TO GET USER OBJECT USE get.user INSTEAD. THIS IS PRIVATE OBJECT */
  readonly document: HydratedDocument<User> | null = null;
  private stack: string[] = [];

  async init(query: string) {
    const document = await UserModel.findOne({ $or: [{ id: query }, { username: query }] }); // Hydrated document required, find by built-in method is not possible
    if (!document) throw new E404(`Document ${query} is not found`);

    // @ts-expect-error Ignore readonly
    this.document = document;
  }

  /** 
   * Save the document
   * 
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    await this.document.save();

    Logger.debug(`[UserService]: Document patched. [id: ${this.document.id}; changes: ${this.stack.length ? this.stack.join(', ') : 'none'}]`);

    this.stack = [];
    return this.stack;
  }

  get user(): User {
    if (!this.document) throw ERR_NO_DOCUMENT;
    return DocumentDTO.user(this.document, true);
  }



  /**
   * Set new user avatar url
   * 
   * @todo test
   */
  setAvatar(url: string) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    this.stack.push(`Avatar changed (${this.document.avatar} > ${url})`);
    this.document.avatar = url;

    this.document.markModified('avatar');
  }



  /**
   * Upload new banner
   * Will save the document
   * 
   * @todo
   */
  async uploadBanner(file: Express.Multer.File) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    let bannerUrl: string;

    // Upload banner
    const uploadedById = this.document.id;
    const postData = await NekomiUploadsAPI.uploadFile({ file, type: 'photo/user/banner', uploadedById });
    bannerUrl = postData.url;

    // Remove previous banner if current is not default
    if (this.document.banner !== config.vars.defaultBanner) {
      const uploadId = NekomiUploadsAPI.getUploadIdFromURL(this.document.banner);
      const deletedById = this.document.id;

      await NekomiUploadsAPI.deleteUpload({ id: uploadId, deletedById });
    }

    this.stack.push(`New banner uploaded (${this.document.banner} > ${bannerUrl})`);

    this.document.banner = bannerUrl;
    this.document.markModified('banner');

    await this.save();
  }



  /**
   * Set / remove telegram link token
   * If token already assigned, will throw error
   * 
   * @todo
   */
  async setTelegramLinkToken(token: string | null) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    // Try to find this telegram token if it is not null
    if (token !== null) {
      const existUser = await UserModel.findOne({ telegramLinkToken: token, id: { $ne: this.document.id } });
      if (existUser) throw ERROR_USER_TGTOKEN_ASSIGNED;
    }

    this.stack.push(`Telegram link token changed (${this.user.telegramLinkToken} > ${token})`);
    this.user.telegramLinkToken = token;

    this.document.markModified('telegramLinkToken');
  }



  /**
   * Set new username
   * 
   * @param force Will skip any checks
   * @todo test
   */
  async setUsername(username: string, force?: boolean) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    if (!force) await this._validateUsername(username);

    this.stack.push(`Username changed (${this.document.username} > ${username})`);
    this.document.username = username;

    this.document.markModified('username');
  }



  /** 
   * Patch watch progress & increase total viewtime
   * 
   * @todo test
   */
  async patchWatchProgress(props: UserPatchWatchProgressProps) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    const { dubberID, episodeOrder, progress, titleID, viewtime } = props;

    const anime = await new AnimeService().getById(titleID, true);
    const dubber = await new DubberService().getById(dubberID, true);

    const episode = anime.episodes.find(el => el.dubberID === dubberID);
    if (!episode) throw new E404(`Anime episode is not found in this dub`);

    const exist = this.document.watchProgress.find(el => el.titleID === titleID);
    let watchProgress = exist ?? { ...props };

    watchProgress.dubberID = dubberID;
    watchProgress.episodeOrder = episodeOrder;
    watchProgress.progress = progress;

    watchProgress.updatedAt = getUTC().timestamp;

    // Increase viewtime
    await this.patchStatistics({ increaseViewtime: viewtime });

    const details = `[animeId: ${titleID}; dubberId: ${dubberID}; episode: ${episodeOrder}; progress: ${progress}s]`;

    if (!exist) {
      this.document.watchProgress.push(watchProgress as UserWatchProgress);

      this.stack.push(`Created new watch progress record. ${details}`);
    } else this.stack.push(`Updated watch progress record. ${details}`);

    this.document.markModified('watchProgress');
  }



  /**
   * Delete anime watch progress
   * 
   * @todo test
   */
  async deleteWatchProgress(animeId: string) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    this.document.watchProgress = this.document.watchProgress.filter(el => el.titleID !== animeId);
    this.document.markModified('watchProgress');

    this.stack.push(`Watch progress for anime was deleted. [animeId: ${animeId}]`);
  }



  /**
   * Patch statistics
   * 
   * @todo test
   */
  async patchStatistics({ increaseViewtime, dubberTeamMember, isTelegramLinked }: PatchUserStatisticProps) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    // Increase viewtime
    if (increaseViewtime !== undefined) {
      if (increaseViewtime > config.VALIDATION.User.MaximumIncreaseViewtime) increaseViewtime = config.VALIDATION.User.MaximumIncreaseViewtime;

      const prevViewtime = this.user.statistics.viewtime;

      this.user.statistics.viewtime += increaseViewtime;
      this.stack.push(`Viewtime increased. [by: ${increaseViewtime} (${prevViewtime} > ${prevViewtime + increaseViewtime})]`);
    }

    // Dubber team member
    if (dubberTeamMember !== undefined) {
      const prevTeam = this.user.statistics.dubber_team_member;

      if (dubberTeamMember === null) {
        this.user.statistics.dubber_team_member = dubberTeamMember;
        this.stack.push(`Kicked from dubber team. [member: ${prevTeam} > ${dubberTeamMember}]`);

        return;
      }

      await new DubberService().getById(dubberTeamMember, true);

      this.user.statistics.dubber_team_member = dubberTeamMember;
      this.stack.push(`Dubber team member changed. [member: ${prevTeam} > ${dubberTeamMember}]`);
    }

    // Link telegram
    if (isTelegramLinked !== undefined) {
      const prevStatus = this.user.statistics.isTelegramLinked;

      this.user.statistics.isTelegramLinked = isTelegramLinked;
      this.stack.push(`Telegram link status changed. [linked: ${prevStatus} > ${isTelegramLinked}]`);
    }

    this.document.markModified('statistics');
  }



  /** 
   * Patch telegram data
   * 
   * @param remove Purge data
   * @todo
   */
  patchTelegramData({ id }: Partial<UserTelegramData>, remove?: boolean) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    if (remove) {
      this.document.telegramData = null;

      this.stack.push(`Telegram data purged`);
      this.document.markModified('telegramData');

      return;
    }

    if (!this.document.telegramData && !id) throw ERROR_USER_TGDATA_ID_MISS;

    this.document.telegramData = this.document.telegramData ?? {
      id: id!
    };

    if (id) {
      this.document.telegramData.id = id;
      this.stack.push(`Telegram data updated (${this.document.telegramData.id} > ${id})`);
    }

    this.document.markModified('telegramData');
  }



  /**
   * Add anime in lib
   * 
   * @todo
   */
  async addInLib(libId: string, animeId: string) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    // Check if anime exist
    await new AnimeService().getById(animeId);

    const lib = this.document.libs.find(el => el.id === libId);
    if (!lib) throw ERROR_USER_LIB_NOT_FOUND;

    // Skip if anime already in
    if (lib.titles.includes(animeId)) return;

    lib.titles.push(animeId);

    this.document.markModified('libs');
    this.stack.push(`Anime ${animeId} added in lib ${libId}`);

  }



  /**
   * Remove anime from lib
   * 
   * @todo
   */
  removeFromLib(libId: string, animeId: string) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const lib = this.document.libs.find(el => el.id === libId);
    if (!lib) throw ERROR_USER_LIB_NOT_FOUND;

    // Skip if lib does not include anime
    if (!lib.titles.includes(animeId)) return;

    lib.titles = lib.titles.filter(el => el !== animeId);

    this.document.markModified('libs');
    this.stack.push(`Anime ${animeId} removed from lib ${libId}`);
  }



  /** 
   * Add role
   * 
   * @param slug ID or code
   * @todo
   */
  async addRole(slug: string) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const role = await RoleModel.findOne({ $or: [{ code: slug }, { id: slug }] });
    if (!role) throw ERROR_ROLE_NOT_FOUND;

    // Skip if user already have this role
    if (this.document.roles.includes(slug)) return;

    this.document.roles.push(role.code);

    this.document.markModified('roles');
    this.stack.push(`Role added (${role.code})`);
  }



  /**
   * Remove role
   * 
   * @param slug ID or code
   * @todo
   */
  async removeRole(slug: string) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    // Skip if user roles does not include this
    if (!this.document.roles.includes(slug)) return;

    this.document.roles = this.document.roles.filter(el => el !== slug);

    this.document.markModified('roles');
    this.stack.push(`Role removed (${slug})`);
  }



  /**
   * Add subscription
   * 
   * @todo
   */
  addSubscribe({ event, payload }: NotifyEventPayload<string>) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const subscription = NotifyService.createEvent({ event, key: payload });

    // Skip if subscription already exist
    if (this.document.subscribes.includes(subscription)) return;

    this.document.subscribes.push(subscription);

    this.document.markModified('subscribes');
    this.stack.push(`Subscription added (${subscription})`);
  }



  /**
   * Remove subscription
   * 
   * @todo
   */
  removeSubscribe({ event, payload }: NotifyEventPayload<string>) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const subscription = NotifyService.createEvent({ event, key: payload });

    // Skip if subscription does not exist
    if (!this.document.subscribes.includes(subscription)) return;

    this.document.subscribes = this.document.subscribes.filter(el => el !== subscription);

    this.document.markModified('subscribes');
    this.stack.push(`Subscription removed (${subscription})`);
  }



  /**
   * Fix user lib anime documents, remove documents that are not exist
   * Will save the document
   * 
   * @returns fixed lib
   * @tested
   */
  async fixLibAnimeDocuments(libId: string): Promise<UserLib> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    const lib = this.document.libs.find(el => el.id === libId);
    if (!lib) throw new E404(`Lib with id (${libId}) is npt found`);

    const libDocs = (await AnimeModel.find({ uuid: { $in: lib.titles } }));

    this.stack.push(`Fixed user lib anime documents (${lib.titles} > ${libDocs.length})`);
    Logger.info(`[UserService]: Fixed user lib anime documents. [userId: ${this.document.id}; libId: ${lib.id}]`);

    lib.titles = libDocs.map(el => el.uuid);

    this.document.markModified('libs');

    await this.save();

    return lib;
  }
}



/** Create UserLib object */
export function UserLibFactory({ name, type, hidden, immortal, titles, DEV_ID }: UserLibFactoryProps): UserLib {
  let id = createStringID(8);

  if (!validator.isLength(name, { min: config.VALIDATION.User.MinimumLibNameLength, max: config.VALIDATION.User.MaximumLibNameLength })) throw ERR_LIB_NAME_INVALID;

  // Set system ID
  if (
    type === 'favorite'
    || type === 'delayed'
    || type === 'plans'
    || type === 'watched'
    || type === 'watching'
  ) id = type;

  id = DevelopmentMode ? DEV_ID ?? id : id;

  return {
    id,
    type,
    createdAt: getUTC().timestamp,
    titles: titles ?? [],
    settings: {
      name,
      hidden: Boolean(hidden),
      immortal: Boolean(immortal),
    }
  };
}

export default UserService;