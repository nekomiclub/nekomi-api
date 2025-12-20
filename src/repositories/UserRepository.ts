import IUser, { IUserViewProgress } from '~/intf/IUser';
import UnifiedRepositoryClass from './UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
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
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('user', schema);



interface IUpdateLibProps {
  is_public?: boolean
}



export class UserRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);
  }



  async setUsername(username: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }




  async setAvatar(url: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }




  // async grantRole() {
  //   if (!this._doc) throw new NekoError('sys:document_not_initialized');
  // }




  // async revokeRole() {
  //   if (!this._doc) throw new NekoError('sys:document_not_initialized');
  // }




  increaseTotalViewtime(sec: number) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }




  async setDubberTeamMember(id: string | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }




  setTelegramId(id: number | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }




  setViewProgress({ anime_id, dubber_id, episode, progress }: Omit<IUserViewProgress, 'updated_at'>) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }




  removeViewProgress(animeId: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }



  async updateLib(id: string, { is_public }: IUpdateLibProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }




  async appendLibAnime(id: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }




  removeLibAnime(id: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');
  }



  // async setCover(file: File) {
  //   if (!this._doc) throw new NekoError('sys:document_not_initialized');
  // }
}



const UserRepository = new UserRepositoryClass();

export default UserRepository;