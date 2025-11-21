import IUser from '~/core/Interfaces/IUser';
import mongoose, { Schema } from 'mongoose';
import { IBasicRepository, RepositoryQueryType } from '~/core/Interfaces/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IUser;



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



class UserRepository implements IBasicRepository<RepositoryType> {
  async getOne(query: string): Promise<RepositoryType> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ id: query, username: query }];

    const result = await model.findOne(queries);
    if (!result) throw Error('INDEV_ERROR');

    return result;
  }

  async safeGetOne(query: string): Promise<RepositoryType | null> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ id: query, username: query }];

    const result = await model.findOne(queries);

    return result;
  }

  async getMany(query: string): Promise<RepositoryType[]> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ id: query, username: query }];

    const results = await model.find(queries);

    return results;
  }

  async getAll(): Promise<RepositoryType[]> {
    return await model.find();
  }

  async deleteOne(id: string): Promise<void> {
    await model.deleteOne({ uuid: id });
  }

  async deleteMany(id: string): Promise<void> {
    await model.deleteMany({ uuid: id });
  }
}



export default UserRepository;