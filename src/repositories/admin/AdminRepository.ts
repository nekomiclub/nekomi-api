import IAdmin, { ADMIN_SLUG } from '~/intf/IAdmin';
import UnifiedRepositoryClass from '~/repo/UnifiedRepository';
import mongoose, { Schema } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
import { RepositoryQueriesType } from '~/intf/types';
import { getUTC } from '~/utils/utils';



/** Repository type. Reffers to the model interface */
type RepositoryType = IAdmin<any, any>

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  created_at: String,
  data: Object,
  slug: String,
  updated_at: String
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('admin', schema);



export default class AdminRepository extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);

    this.RepositoryName = 'AdminRepository (unassigned)';
  }



  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    this.set('updated_at', getUTC().ISO);

    await this._save({ id: this._doc.id });
  }



  async deleteOne(slug: ADMIN_SLUG): Promise<void> {
    throw new NekoError('sys:not_implemented');
  }



  /** @unavailable */
  async deleteMany(): Promise<void> {
    throw new NekoError('sys:not_implemented', `Method is unavailable`);
  }
}