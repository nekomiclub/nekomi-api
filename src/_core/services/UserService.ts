import AnimeService from './AnimeService';
import DubberService from './DubberService';
import User, { UserLib, UserWatchProgress } from '~/core/interfaces/UserIntf';
import UserModel from '~/core/models/UserModel';
import createID, { createUUID } from '~/utils/create-id';
import createSlug from '~/utils/create-slug';
import getUTC from '~/utils/get-utc';
import trimString from '~/utils/trim-string';
import validator from 'validator';
import { DevelopmentMode, config } from '~/config';
import { E400, E404, ERR_ALREADY_EXIST, ERR_LENGTH_INVALID, ERR_NO_DOCUMENT } from '~/services/ErrorService';
import { HydratedDocument } from 'mongoose';
import { Logger } from '~/services/LoggerService';
import { MongoDocumentDTO } from './DTO';
import { ServiceControls, SinglePartial } from '~/core/interfaces/types';



interface UserCreateProps {
  username: string
  avatar?: string

  /** Specifies if user was handled by fullkekw user api. Will pass some checks if true */
  byUserApi?: boolean
  DEV_ID?: string
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

interface UserPatchStatistics {
  /** In seconds */
  increaseViewtime?: number

  isTelegramLinked?: boolean
  dubberTeamMember?: string | null
}



type TUserModelControls = ServiceControls<UserCreateProps, User>
type UserPatchWatchProgressProps = SinglePartial<UserWatchProgress, 'updatedAt'>;



export const ERR_LIB_NAME_INVALID = new E400(`Lib name must be between ${config.VALIDATION.User.MinimumLibNameLength} and ${config.VALIDATION.User.MaximumLibNameLength} symbols length`, 'user:lib_name_invalid');
export const ERR_VIEWTIME_INVALID = new E400(`Lib name must be between ${config.VALIDATION.User.MinimumLibNameLength} and ${config.VALIDATION.User.MaximumLibNameLength} symbols length`, 'user:lib_name_invalid');



class UserModelControls implements TUserModelControls {
  async create({ username, DEV_ID, avatar, byUserApi }: UserCreateProps): Promise<User> {
    username = createSlug(trimString(username));

    if (!byUserApi) {
      if (!validator.isLength(username, { min: config.VALIDATION.CreateUser.minNameLength, max: config.VALIDATION.CreateUser.maxNameLength })) throw ERR_LENGTH_INVALID;

      const exist = await UserModel.findOne({ username });
      if (exist) throw new ERR_ALREADY_EXIST(`User with this username is already exist`);
    }

    const id = DevelopmentMode ? DEV_ID ?? createUUID() : createUUID();

    const instance: User = {
      id,
      username,
      avatar: avatar ?? config.vars.defaultAvatar,
      banner: config.vars.defaultBanner,
      roles: ['user'],
      watchProgress: [],
      togetherRooms: [],
      subscribes: [],
      telegramData: null,
      telegramLinkToken: null,
      statistics: {
        accountCreated: getUTC().timestamp,
        dubberTeamMember: null,
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
    await document.save();

    Logger.info(`[UserService]: New document was created. [id: ${id}]`);

    return instance;
  }

  async deleteOne(id: string): Promise<void> {
    await UserModel.deleteOne({ id });

    Logger.info(`[UserService]: Single document was deleted. [id: ${id}]`);
  }

  async deleteMany(id: string): Promise<void> {
    const details = await UserModel.deleteMany({ id });

    Logger.info(`[UserService]: Some document were deleted. [id: ${id}; count: ${details.deletedCount}]`);
  }

  async getAll(details?: boolean): Promise<User[]> {
    const total = await UserModel.find();
    const list = total.map(document => {
      return new MongoDocumentDTO().user({ document, details });
    });

    return list;
  }

  async getById(id: string, details?: boolean): Promise<User> {
    const document = await UserModel.findOne({ id });
    if (!document) throw new E404(`User with id (${id}) is not found`);

    return new MongoDocumentDTO().user({ document, details });
  }

  async getByQuery(query: string, details?: boolean): Promise<User> {
    const document = await UserModel.findOne({ $or: [{ id: query }, { username: query }] });
    if (!document) throw new E404(`User with query (${query}) is not found`);

    return new MongoDocumentDTO().user({ document, details });
  }
}



/** 
 * Brand-new implementation of database services
 * This service must be initialized by calling @method init()
*/
export class UserService extends UserModelControls {
  private document: HydratedDocument<User> | null = null;
  private stack: string[] = [];

  async init(query: string) {
    const document = await UserModel.findOne({ $or: [{ id: query }, { username: query }] }); // Hydrated document required, find by built-in method is not possible
    if (!document) throw new E404(`Document ${query} is not found`);

    this.document = document;
  }

  /** Save the document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    if (!this.document) throw ERR_NO_DOCUMENT;

    await this.document.save();

    Logger.debug(`[UserService]: Document patched. [id: ${this.document.id}; changes: ${this.stack.length ? this.stack.join(', ') : 'none'}]`);

    return this.stack;
  }

  get user(): User {
    if (!this.document) throw ERR_NO_DOCUMENT;
    return new MongoDocumentDTO().user({ document: this.document, details: true });
  }



  /** Patch watch progress & increase total viewtime */
  async patchWatchProgress(props: UserPatchWatchProgressProps) {
    if (!this.document) throw ERR_NO_DOCUMENT;
    const { dubberID, episodeOrder, progress, titleID } = props;

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
    await this.patchStatistics({ increaseViewtime: progress });

    const details = `[animeId: ${titleID}; dubberId: ${dubberID}; episode: ${episodeOrder}; progress: ${progress}s]`;

    if (!exist) {
      this.document.watchProgress.push(watchProgress as UserWatchProgress);

      this.stack.push(`Created new watch progress record. ${details}`);
    } else this.stack.push(`Updated watch progress record. ${details}`);

    this.document.markModified('watchProgress');
  }

  async deleteWatchProgress({ animeId }: { animeId: string }) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    this.document.watchProgress = this.document.watchProgress.filter(el => el.titleID !== animeId);
    this.document.markModified('watchProgress');

    this.stack.push(`Watch progress for anime was deleted. [animeId: ${animeId}]`);
  }

  async patchStatistics({ increaseViewtime, dubberTeamMember, isTelegramLinked }: UserPatchStatistics) {
    if (!this.document) throw ERR_NO_DOCUMENT;

    if (increaseViewtime !== undefined) {
      if (increaseViewtime > config.VALIDATION.User.MaximumIncreaseViewtime) increaseViewtime = config.VALIDATION.User.MaximumIncreaseViewtime;

      const prevViewtime = this.user.statistics.viewtime;

      this.user.statistics.viewtime += increaseViewtime;

      this.stack.push(`Viewtime increased. [by: ${increaseViewtime} (${prevViewtime} > ${prevViewtime + increaseViewtime})]`);
    }

    if (dubberTeamMember !== undefined) {
      const prevTeam = this.user.statistics.dubberTeamMember;

      if (dubberTeamMember === null) {
        this.user.statistics.dubberTeamMember = dubberTeamMember;

        this.stack.push(`Kicked from dubber team. [member: ${prevTeam} > ${dubberTeamMember}]`);

        return;
      }

      const dubber = await new DubberService().getById(dubberTeamMember, true);

      this.user.statistics.dubberTeamMember = dubberTeamMember;

      this.stack.push(`Dubber team member changed. [member: ${prevTeam} > ${dubberTeamMember}]`);
    }

    if (isTelegramLinked !== undefined) {
      const prevStatus = this.user.statistics.isTelegramLinked;

      this.user.statistics.isTelegramLinked = isTelegramLinked;

      this.stack.push(`Telegram link status changed. [linked: ${prevStatus} > ${isTelegramLinked}]`);
    }

    this.document.markModified('statistics');
  }
}



/** Create UserLib object */
export function UserLibFactory({ name, type, hidden, immortal, titles, DEV_ID }: UserLibFactoryProps): UserLib {
  let id = createID(8);

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