import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/User';

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

export default User; 