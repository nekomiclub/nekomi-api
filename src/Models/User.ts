import mongoose, { HydratedDocument, Schema } from 'mongoose';

import { IUser, IUserLib, IUserStatistics, IUserTelegramData, IUserWatchProgress } from '../interfaces/User';
import * as cfg from '../config';
import { config } from '../config';
import { Logger } from '../services/LoggerService';
import validator from 'validator';
import { E404, E503, ERR_ACCESS_REJECTED, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID } from '../services/ErrorService';
import { createID, getUTC } from '../handlers/handler';
import Title from './Title';
import Role from './Role';
import { TNotifyEvent } from '../interfaces/services/Notify';
import DubberModel from './Dubber';
import { AxiosError } from 'axios';
import { $http } from '../handlers/http';
import { ANIMEE_UPLOADS, IA_UploadsUpload } from '../interfaces/http/Uploads';



interface IUserServiceProps {
  user: HydratedDocument<IUser>
}

interface IUserCreate {
  id: string
  username: string

  avatar?: string
}

interface IPatchLib {
  titleID: string
  libID: string
}

interface IPatchRole {
  code: string
}

interface IPatchSubsribe {
  event: TNotifyEvent

  /** Subscribe key */
  key: string
}

interface IPatchTelegramData extends Partial<IUserTelegramData> {
  /** Write telegramData to null */
  remove?: boolean
}



/** To create/patch/delete User instance use UserService */
export const UserModel = mongoose.model<IUser>('user', new Schema({
  id: String,
  libs: Array,
  statistics: Object,
  roles: Array,
  avatar: String,
  username: String,
  subscribes: Array,
  watchProgress: Array,
  telegramData: Object,
  telegramLinkToken: String,
  banner: String,
}));



/** Create/path/delete User instance */
export class UserService {
  readonly user: HydratedDocument<IUser>;
  readonly stack: string[] = [];

  constructor({ user }: IUserServiceProps) {
    this.user = user;
  }



  static async create({ id, username, avatar }: IUserCreate): Promise<HydratedDocument<IUser>> {
    if (!validator.isAlpha(username, 'en-US') && !validator.isAlphanumeric(username, 'en-US')) throw new ERR_INVALID_PAYLOAD(`Username must be Alpha or Alphanumeric`);
    if (!validator.isLength(username, { min: cfg.RULES.CreateUser.minNameLength, max: cfg.RULES.CreateUser.maxNameLength })) throw new ERR_LENGTH_INVALID(`Username length is not valid`);
    if (avatar !== undefined && !validator.isURL(avatar)) throw new ERR_INVALID_PAYLOAD(`Avatar is not URL`);

    const existUser = await UserModel.findOne({ $or: [{ id }, { username }] });
    if (existUser) throw new ERR_ALREADY_EXIST(`User with this id or username already exist`);

    const libs: IUserLib[] = [
      {
        createdAt: getUTC().timestamp,
        id: createID(),
        settings: {
          hidden: false,
          immortal: true,
          name: 'Улюблені'
        },
        titles: [],
        type: 'favorite'
      }, {
        createdAt: getUTC().timestamp,
        id: createID(),
        settings: {
          hidden: false,
          immortal: true,
          name: 'Переглянуті'
        },
        titles: [],
        type: 'watched'
      }, {
        createdAt: getUTC().timestamp,
        id: createID(),
        settings: {
          hidden: false,
          immortal: true,
          name: 'Переглядаю'
        },
        titles: [],
        type: 'watching'
      }, {
        createdAt: getUTC().timestamp,
        id: createID(),
        settings: {
          hidden: true,
          immortal: true,
          name: 'Плани'
        },
        titles: [],
        type: 'plans'
      }, {
        createdAt: getUTC().timestamp,
        id: createID(),
        settings: {
          hidden: true,
          immortal: true,
          name: 'Відкладені'
        },
        titles: [],
        type: 'delayed'
      }
    ];

    const payload: IUser = {
      id,
      username,
      avatar: avatar || config.vars.defaultAvatar,
      banner: config.vars.defaultUserBanner,
      libs,
      roles: ['user'],
      statistics: {
        accountCreated: getUTC().timestamp,
        isTelegramLinked: false,
        viewtime: 0
      },
      subscribes: [],
      telegramData: null,
      telegramLinkToken: null,
      watchProgress: []
    };

    const user = new UserModel(payload);
    await user.save();

    Logger.debug(`[UserService]: New user created with id ${id}`);

    return user;
  }

  static async delete(id: string, reason?: string, count?: 'one' | 'many') {
    if (count === undefined || count === 'one') {
      await UserModel.deleteOne({ id });
    } else if (count === 'many') {
      await UserModel.deleteMany({ id });
    }

    Logger.debug(`[UserService]: Deleted user with id ${id}. Reason - ${reason || 'Not provided'}`);
  }

  /** Save the document
   * @returns current patch stack
   */
  async save(): Promise<string[]> {
    await this.user.save();

    Logger.debug(`[UserService]: User ${this.user.id} patched! Stack - ${this.stack.length ? this.stack.join('; ') : 'Nothing patched...'}`);

    return this.stack;
  }

  //* ------------ AVATAR

  /** Patch avatar */
  async patchAvatar({ url }: { url: string }) {
    if (!validator.isURL(url)) throw new ERR_INVALID_PAYLOAD(`Avatar URL is invalid`);

    this.stack.push(`Avatar URL changed (${this.user.avatar} > ${url})`);
    this.user.avatar = url;

    this.user.markModified('avatar');
  }

  //* ------------ BANNER

  /** Upload profile banner. Will save the document */
  async uploadBanner({ file }: { file: Express.Multer.File }) {
    const { buffer, originalname, filename, mimetype } = file;
    const formData = new FormData();

    formData.append('file', new Blob([buffer], {
      type: mimetype
    }), originalname);
    formData.set('uploadedBy', this.user.id);
    formData.set('type', 'photo/user/banner');

    const UPLOAD_DATA: { url: string } = {
      url: ''
    };

    try {
      // Upload banner
      const { data: postData } = await $http.post<IA_UploadsUpload>(ANIMEE_UPLOADS.upload, formData);
      UPLOAD_DATA.url = postData.url;

      // Remove previous banner if it not default
      if (this.user.banner !== config.vars.defaultUserBanner) {
        const uploadID = this.user.banner.split('/')[this.user.banner.split('/').length - 1];

        await $http.delete(ANIMEE_UPLOADS.delete_upload(uploadID), {
          params: {
            by: this.user.id
          }
        });
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') {
          throw new E503('Nekomi-uploads is not available. Try in a few minutes');
        }

        throw e;
      } else {
        throw e;
      }
    }

    this.user.banner = UPLOAD_DATA.url;
    this.user.markModified('banner');

    this.stack.push(`New avatar uploaded`);

    await this.save();
  }

  //* ------------ USERNAME

  /** Patch username */
  async patchUsername({ username, bypassValidation }: { username: string, bypassValidation?: boolean }) {
    if (!bypassValidation && !validator.isAlpha(username, 'en-US') && !validator.isAlphanumeric(username, 'en-US')) throw new ERR_INVALID_PAYLOAD(`Username must be Alpha or Alphanumeric`);
    if (!bypassValidation && !validator.isLength(username, { min: cfg.RULES.CreateUser.minNameLength, max: cfg.RULES.CreateUser.maxNameLength })) throw new ERR_LENGTH_INVALID(`Username length is not valid`);

    const existUser = await UserModel.findOne({ username, id: { $ne: this.user.id } });
    if (existUser) throw new ERR_ALREADY_EXIST(`User with username ${username} already exist`);

    this.stack.push(`Username changed (${this.user.username} > ${username})`);
    this.user.username = username;
  }

  //* ------------ TELEGRAM LINK TOKEN

  /** Patch user telegram link token */
  async patchTelegramLinkToken({ token }: { token: string | null }) {
    // Ignore finding exist user if token is null
    if (token !== null) {
      const existUser = await UserModel.findOne({ telegramLinkToken: token, id: { $ne: this.user.id } });
      if (existUser) throw new ERR_ALREADY_EXIST(`User with this telegram token already exist`);
    }

    this.stack.push(`Telegram link token changed (${this.user.telegramLinkToken} > ${token})`);
    this.user.telegramLinkToken = token;

    this.user.markModified('telegramLinkToken');
  }

  //* ------------ STATS

  /** Patch user statistics
   * @param viewtime will INCREASE CURRENT BY PROVIDED SECONDS
   */
  async patchStatistics({ isTelegramLinked, viewtime }: Partial<IUserStatistics>) {
    if (isTelegramLinked !== undefined) {
      this.stack.push(`Changed isTelegramLinked (${this.user.statistics.isTelegramLinked} > ${isTelegramLinked})`);
      this.user.statistics.isTelegramLinked = isTelegramLinked;
    }

    if (viewtime !== undefined) {
      if (viewtime < 0 || viewtime > 120000) throw new ERR_INVALID_PAYLOAD(`Viewtime can not be increased by more than 2h or less than 0s`);

      this.stack.push(`Viewtime increased (${this.user.statistics.viewtime}s + ${viewtime}s)`);
      this.user.statistics.viewtime + viewtime;
    }

    this.user.markModified('statistics');
  }

  //* ------------ WATCH PROGRESS

  /** Patch user watch progress
   * @param updatedAt is optional
   */
  async patchWatchProgress({ dubberID, episodeOrder, progress, titleID }: IUserWatchProgress) {
    const dubber = await DubberModel.findOne({ id: dubberID });
    if (!dubber) throw new E404(`Dubber ${dubberID} is not found`);

    const title = await Title.findOne({ id: titleID });
    if (!title) throw new E404(`Title ${titleID} is not found`);

    const item = this.user.watchProgress.find(el => el.titleID === titleID);

    if (item) {
      // Patch exist

      this.stack.push(`Watch progress for ${item.episodeOrder} in title ${title.id} changed (progress: ${item.progress}s > ${progress}s; ${item.episodeOrder !== episodeOrder ? `ep: ${item.episodeOrder} > ${episodeOrder};` : ''} ${item.dubberID !== dubberID ? `dubber: ${item.dubberID} > ${dubberID}` : ''})`);

      item.dubberID = dubberID;
      item.episodeOrder = episodeOrder;
      item.progress = progress;
      item.updatedAt = getUTC().timestamp;

    } else {
      // Create new

      const item: IUserWatchProgress = {
        dubberID,
        episodeOrder,
        progress,
        titleID,
        updatedAt: getUTC().timestamp
      };

      this.user.watchProgress.push(item);
      this.stack.push(`Added new watch progress item for ${episodeOrder} episode in title ${title.id} in dub ${dubber.id}`);
    }

    this.user.markModified('watchProgress');
  }

  //* ------------ TELEGRAM DATA

  /** Patch user telegram data
   * @param remove Will set null to telegramData object
   */
  async patchTelegramData({ id, remove }: IPatchTelegramData) {
    if (remove) {
      this.user.telegramData = null;
      this.user.markModified('telegramData');

      return;
    }

    if (this.user.telegramData === null && id === undefined) throw new ERR_INVALID_PAYLOAD(`Telegram data is not specified and id is not provided`);

    this.user.telegramData = this.user.telegramData !== null ? this.user.telegramData : {
      id: id!
    };

    if (id !== undefined) {
      this.user.telegramData.id = id;
      this.stack.push(`Changed telegram data id (${this.user.telegramData.id} > ${id})`);
    }

    this.user.markModified('telegramData');
  }

  //* ------------ LIB

  /** Add title to lib */
  async addToLib({ libID, titleID }: IPatchLib) {
    const lib = this.user.libs.find(el => el.id === libID);
    if (!lib) throw new E404(`Lib ${libID} is not found`);

    const title = await Title.findOne({ id: titleID });
    if (!title) throw new E404(`Title ${titleID} is not found`);

    if (!lib.titles.includes(title.id)) {
      lib.titles.push(title.id);
      this.stack.push(`Added title ${title.id} to lib ${lib.id}`);
    }

    this.user.markModified('libs');
  }

  /** Remove title from lib */
  async removeFromLib({ libID, titleID }: IPatchLib) {
    const lib = this.user.libs.find(el => el.id === libID);
    if (!lib) throw new E404(`Lib ${libID} is not found`);

    const title = await Title.findOne({ id: titleID });
    if (!title) throw new E404(`Title ${titleID} is not found`);

    lib.titles = lib.titles.filter(el => el !== title.id);
    this.stack.push(`Removed title ${title.id} from lib ${lib.id}`);

    this.user.markModified('libs');
  }

  //* ------------ ROLE

  /** Add user role */
  async addRole({ code }: IPatchRole) {
    const role = await Role.findOne({ code });
    if (!role) throw new E404(`Role ${code} is not found`);

    if (!this.user.roles.includes(code)) {
      this.user.roles.push(code);
      this.stack.push(`Added role ${role.id}`);
    }

    this.user.markModified('roles');
  }

  /** Remove user role */
  async removeRole({ code }: IPatchRole) {
    const role = await Role.findOne({ code });
    if (!role) throw new E404(`Role ${code} is not found`);

    this.user.roles = this.user.roles.filter(el => el !== code);
    this.stack.push(`Removed role ${role.id}`);

    this.user.markModified('roles');
  }

  //* ------------ SUBSCRIBES

  /** Add user subscribe */
  async addSubscribe({ event, key }: IPatchSubsribe) {
    const subscribe = `${event}/${key}`;

    if (!this.user.subscribes.includes(subscribe)) {
      this.user.subscribes.push(subscribe);
      this.stack.push(`Added subscribe ${subscribe}`);
    }

    this.user.markModified('subscribes');
  }

  /** Remove user subscribe */
  async removeSubscribe({ event, key }: IPatchSubsribe) {
    const subscribe = `${event}/${key}`;

    this.user.subscribes = this.user.subscribes.filter(el => el !== subscribe);
    this.stack.push(`Removed subscribe ${subscribe}`);

    this.user.markModified('subscribes');
  }
}

export default UserModel; 