import IUser from '~/intf/IUser';
import UnifiedRepositoryClass from './UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { RepositoryQueriesType } from '~/intf/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IUser;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { username: query }] };
};



const model = mongoose.model<RepositoryType>('user', new Schema({
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



export class UserRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);
  }
}



const UserRepository = new UserRepositoryClass();

export default UserRepository;