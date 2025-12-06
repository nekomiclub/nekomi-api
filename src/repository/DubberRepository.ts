import IDubber from '~/intf/IDubber';
import UnifiedRepositoryClass from './UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { RepositoryQueriesType } from '~/intf/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IDubber;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};


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



export class DubberRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor(query?: string) {
    super(model, queries, query);
  }
}



const DubberRepository = new DubberRepositoryClass();

export default DubberRepository;