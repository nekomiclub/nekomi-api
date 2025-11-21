import IUser from '~/core/Interfaces/IUser';
import UnifiedRepository from './UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { RepositoryQueriesType } from '~/core/Interfaces/types';



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



export class UserRepositoryClass extends UnifiedRepository<RepositoryType> {
  constructor(query?: string) {
    super(model, queries, query);
  }
}



const UserRepository = new UserRepositoryClass();

export default UserRepository;