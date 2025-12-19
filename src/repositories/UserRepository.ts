import IUser from '~/intf/IUser';
import UnifiedRepositoryClass from './UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { RepositoryQueriesType } from '~/intf/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IUser;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { username: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  username: String,
  avatar: String,
  cover: String,

  roles: [String],
  libs: [Schema.Types.Mixed],

  total_viewtime: Number,
  view_progress: [Schema.Types.Mixed],
  dubber_team_member: String,
  telegram_id: Number,

  created_at: Date,
  updated_at: Date,
}, { strict: false, versionKey: false, _id: false });

const model = mongoose.model<RepositoryType>('user', schema);



export class UserRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);
  }
}



const UserRepository = new UserRepositoryClass();

export default UserRepository;