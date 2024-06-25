import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/User';
import { DeepPartial } from '../interfaces/Interfaces';
import { createID, getUTC } from '../handlers/handlers';
import { TRoleCapability } from '../interfaces/Roles';
import { writeLog } from '../handlers/Errors';

export const User = mongoose.model<IUser>('user', new Schema({
  id: String,
  libs: Array,
  statistics: Object,
  roles: Array,
  avatar: String,
  username: String
}));

/** Create new user
 * @returns user ID
 */
export async function createUser({ id, roles, avatar, username }: {
  username: string

  avatar: string

  id?: string

  roles?: string[]
}): Promise<string> {
  id = id || createID();
  roles = roles || ['user'];

  const payload: IUser = {
    id,
    libs: [
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
    ],
    roles,
    statistics: {
      accountCreated: getUTC().timestamp,
      timeSpent: 0
    },
    avatar,
    username
  };

  const user = new User(payload);

  await user.save();
  writeLog('info', `New user ${id} created`, 'User/createUser');

  return id;
}

export default User; 