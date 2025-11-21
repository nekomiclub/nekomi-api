import IUser from '~/core/Interfaces/IUser';
import mongoose, { Schema } from 'mongoose';



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

export default UserModel;