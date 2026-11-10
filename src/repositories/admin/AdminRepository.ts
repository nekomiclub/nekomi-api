import mongoose, { Schema } from 'mongoose';

import AdminEntity, { ADMIN_SLUG_ENUM } from '~/domain/admin.schema.js';
import { RepositoryQueriesType } from '~/interfaces/types.js';
import UnifiedRepositoryClass from '~/repositories/UnifiedRepository.js';
import { NekoError } from '~/services/ExceptionService.js';
import { getUTC } from '~/utils/utils.js';



/** Repository type. Reffers to the model interface */
type RepositoryType = AdminEntity<any, any>

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

    this._set('updated_at', getUTC().ISO);

    await this._save({ id: this._doc.id });
  }



  async deleteOne(slug: ADMIN_SLUG_ENUM): Promise<void> {
    throw new NekoError('sys:not_implemented');
  }



  /** @unavailable */
  async deleteMany(): Promise<void> {
    throw new NekoError('sys:not_implemented', `Method is unavailable`);
  }
}