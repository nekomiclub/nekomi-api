import IDubber from '~/core/Interfaces/IDubber';
import mongoose, { Schema } from 'mongoose';
import { IBasicRepository, RepositoryQueryType } from '~/core/Interfaces/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IDubber;



const model = mongoose.model<IDubber>('dubber', new Schema({
  id: String,
  code: String,
  name: String,
  socials: Object,
  support: Object,
  createdAt: Number,
  description: String,
  members: Array,
  avatar: String,
  membersInvited: Array,
  statistics: Object,
  nameEng: String,
  nameUkr: String,
  slug: String,
  banner: String,
}));



class DubberRepository implements IBasicRepository<RepositoryType> {
  async getOne(query: string): Promise<RepositoryType> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ id: query, slug: query }];

    const result = await model.findOne(queries);
    if (!result) throw Error('INDEV_ERROR');

    return result;
  }

  async safeGetOne(query: string): Promise<RepositoryType | null> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ id: query, slug: query }];

    const result = await model.findOne(queries);

    return result;
  }

  async getMany(query: string): Promise<RepositoryType[]> {
    const queries: RepositoryQueryType<RepositoryType>[] = [{ id: query, slug: query }];

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



export default DubberRepository;