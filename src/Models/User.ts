import mongoose, { Schema } from 'mongoose';
import { IUser, IUserLib } from '../interfaces/User';
import { DeepPartial } from '../interfaces/Interfaces';
import { createID, getUTC } from '../handlers/handlers';
import { TRoleCapability } from '../interfaces/Roles';
import { writeLog } from '../handlers/Errors';
import { testMode } from '../config';
import * as cfg from '../config';

export const User = mongoose.model<IUser>('user', new Schema({
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

  const user = new User(payload);

  await user.save();
  writeLog('info', `New user ${id} created`, 'User/createUser');

  return id;
}

export default User; 