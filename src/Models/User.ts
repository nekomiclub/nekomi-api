import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/User';
import { DeepPartial } from '../interfaces/Interfaces';
import { createID, getUTC } from '../handlers/v1/handlers';

export const User = mongoose.model<IUser>('user', new Schema({
  id: String,
  avatar: String,
  username: String,
  lists: Array,
  libs: Array,
  stats: Object,
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
    username,
    lists: [
      {
        createdAt: getUTC().timestamp,
        description: 'Тайтли, які запали в саме серце',
        hidden: true,
        id: `favorite-${createID()}`,
        immortal: true,
        name: 'Улюблені',
        thumb: '',
        titles: []
      },
      {
        createdAt: getUTC().timestamp,
        description: 'Ти вже в цій тємі',
        hidden: true,
        id: `watched-${createID()}`,
        immortal: true,
        name: 'Переглянуті',
        thumb: '',
        titles: []
      }, {
        createdAt: getUTC().timestamp,
        description: 'Колись вони будуть переглянуті',
        hidden: true,
        id: `plans-${createID()}`,
        immortal: true,
        name: 'В планах',
        thumb: '',
        titles: []
      }, {
        createdAt: getUTC().timestamp,
        description: 'Хто зна коли їх перегляд буде закінчений',
        hidden: true,
        id: `delayed-${createID()}`,
        immortal: true,
        name: 'Відкладено',
        thumb: '',
        titles: []
      }, {
        createdAt: getUTC().timestamp,
        description: 'Ого, так багато?',
        hidden: true,
        id: `watching-${createID()}`,
        immortal: true,
        name: 'Переглядаю',
        thumb: '',
        titles: []
      },
    ],
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
    stats: {
      createdAt: getUTC().timestamp,
      player: {
        popularDub: null,
        totalWatched: 0,
        watchedTitles: []
      },
      titles: {
        delayed: 0,
        favorites: 0,
        plans: 0,
        threwn: 0,
        watched: 0
      }
    },
    statistics: {
      accountCreated: getUTC().timestamp,
      timeSpent: 0
    },
    avatar: avatarURL
  };

  const user = new User(payload);

  await user.save();

  return id;
}

export default User; 