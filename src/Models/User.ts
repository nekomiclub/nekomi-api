import mongoose, { Schema } from 'mongoose';
import { IUser } from '../core/interfaces';

export const User = mongoose.model<IUser>('user', new Schema({
  uid: String,
  avatar: String,
  password: String,
  email: String,
  profileBg: String,
  username: String,
  providers: Array<'google' | 'telegram' | 'animee' | 'fullkekw'>,
  settings: {},
  badgesIDs: Array<string>,
  lists: Array<{
    titles: string[],
    createdAt: number,
    immortal: boolean,
    hidden: boolean,
    thumb: string,
    description: string,
    name: string,
    id: string
  }>,
  stats: {
    createdAt: Number,
    titles: {
      watched: Number,
      favorites: Number,
      plans: Number,
      delayed: Number,
      threwn: Number
    },
    player: {
      totalWatched: Number || null,
      popularDub: String || null,
      watchedTitles: Array<{
        title: string,
        dubs: Array<{
          id: string,
          totalWatch: number
        }>
      }> || null
    }
  },
  roles: ['admin' || 'dubber' || 'editor' || 'moderator' || 'root' || 'subber' || 'subscriber' || 'user'],
  accountType: String
}));

export default User; 