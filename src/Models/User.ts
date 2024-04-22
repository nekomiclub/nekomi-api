import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/User';
import { DeepPartial } from '../interfaces/Interfaces';
import { createID, getUTC } from '../handlers/v1/handlers';

export const User = mongoose.model<IUser>('user', new Schema({
  id: String,
  uid: String,
  avatar: String,
  password: String,
  email: String,
  profileBg: String,
  username: String,
  providers: Array,
  settings: Object,
  badgesIDs: Array,
  lists: Array,
  stats: Object,
  roles: Array,
  accountType: String
}));

/** Create new user
 * @returns user ID
 */
export async function createUser({ email, username, avatarURL, customId }: {
  email: string,
  username?: string,
  avatarURL: string,
  customId?: string
}): Promise<string> {
  const id = customId || createID();

  const payload: IUser = {
    id,
    email,
    username: username || email.split('@')[0],
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
    roles: ['user'],
    settings: {},
    accountType: 'new',
    uid: id,
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
    providers: [],
    profileBg: '',
    password: '',
    badgesIDs: [],
    avatar: avatarURL
  };

  const user = new User(payload);

  await user.save();

  return id;
}

export default User; 