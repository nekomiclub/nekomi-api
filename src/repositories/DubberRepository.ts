import IDubber from '~/intf/IDubber';
import UnifiedRepositoryClass from './UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { RepositoryQueriesType } from '~/intf/types';



/** Repository type. Reffers to the model interface */
type RepositoryType = IDubber;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  slug: String
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('dubber', schema);



export class DubberRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);
  }
}



const DubberRepository = new DubberRepositoryClass();

export default DubberRepository;