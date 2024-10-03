import mongoose, { HydratedDocument, Schema } from 'mongoose';

import { IUser, IUserLib } from '../interfaces/User';
import { getUTC } from '../handlers/handlers';
import * as cfg from '../config';
import { config } from '../config';
import { Logger } from '../services/LoggerService';
import validator from 'validator';
import { ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID } from '../services/ErrorService';
import { createID, getNewUTC } from '../handlers/handler';

interface IUserCreate {
  id: string
  username: string

  avatar?: string
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
  telegramLinkToken: String
}));

/** Create new user
 * @deprecated use UserService instead
 * @returns user ID
 */
export async function createUser({ id, roles, avatar, username, libs, test }: {
  username: string

  avatar: string

  id?: string

  roles?: string[],

  /** Libs will be overridden only in test mode */
  libs?: IUserLib[],

  /** Specify test mode */
  test?: boolean
}): Promise<string> {
  const testMode = cfg.testMode || test;

  id = id || createID();
  roles = roles || ['user'];
  libs = (testMode && libs?.length) ? libs : [
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
    libs,
    roles,
    statistics: {
      accountCreated: getUTC().timestamp,
      timeSpent: 0,
      viewtime: 0,
      isTelegramLinked: false
    },
    avatar,
    username,
    subscribes: [],
    watchProgress: [],
    telegramData: null,
    telegramLinkToken: null
  };

  const user = new UserModel(payload);

  await user.save();

  Logger.debug(`[User]: User @${username}/${id} crated`);

  return id;
}

/** Create/path/delete User instance */
export class UserService {
  static async create({ id, username, avatar }: IUserCreate): Promise<HydratedDocument<IUser>> {
    if (!validator.isAlpha(username, 'en-US')) throw new ERR_INVALID_PAYLOAD(`Username must be Alpha`);
    if (!validator.isLength(username, { min: cfg.rules.CreateUser.minNameLength, max: cfg.rules.CreateUser.maxNameLength })) throw new ERR_LENGTH_INVALID(`Username length is not valid`);
    if (avatar !== undefined && !validator.isURL(avatar)) throw new ERR_INVALID_PAYLOAD(`Avatar is not URL`);

    const existUser = await UserModel.findOne({ $or: [{ id }, { username }] });
    if (existUser) throw new ERR_ALREADY_EXIST(`User with this id or username already exist`);

    const libs: IUserLib[] = [
      {
        createdAt: getNewUTC().timestamp,
        id: createID(),
        settings: {
          hidden: false,
          immortal: true,
          name: 'Улюблені'
        },
        titles: [],
        type: 'favorite'
      }, {
        createdAt: getNewUTC().timestamp,
        id: createID(),
        settings: {
          hidden: false,
          immortal: true,
          name: 'Переглянуті'
        },
        titles: [],
        type: 'watched'
      }, {
        createdAt: getNewUTC().timestamp,
        id: createID(),
        settings: {
          hidden: false,
          immortal: true,
          name: 'Переглядаю'
        },
        titles: [],
        type: 'watching'
      }, {
        createdAt: getNewUTC().timestamp,
        id: createID(),
        settings: {
          hidden: true,
          immortal: true,
          name: 'Плани'
        },
        titles: [],
        type: 'plans'
      }, {
        createdAt: getNewUTC().timestamp,
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
      libs,
      roles: ['user'],
      statistics: {
        accountCreated: getNewUTC().timestamp,
        isTelegramLinked: false,
        viewtime: 0,
        timeSpent: 0
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

  static async delete(id: string, reason?: string) {
    await UserModel.deleteMany({ id });

    Logger.debug(`[UserService]: Deleted user with id ${id}. Reason - ${reason || 'Not provided'}`);
  }

  static async patch(id: string, body: Partial<IUser>) {

  }
}

export default UserModel; 