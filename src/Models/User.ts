import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/User';
import { DeepPartial } from '../interfaces/Interfaces';
import { createID, getUTC } from '../handlers/handlers';

export const User = mongoose.model<IUser>('user', new Schema({
  id: String,
  libs: Array,
  statistics: Object,
  roles: Array,
}));

/** Create new user
 * @returns user ID
 */
export async function createUser({ username, avatarURL, id }: {
  username: string,
  avatarURL: string,
  id: string
}): Promise<string> {
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
    roles: ['user'],
    statistics: {
      accountCreated: getUTC().timestamp,
      timeSpent: 0
    },
  };

  const user = new User(payload);

  await user.save();

  return id;
}

export default User; 