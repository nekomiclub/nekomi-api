import DTOService from '~/service/DataTransferService';
import IRole, { ROLE_PERMISSION } from '~/intf/IRole';
import Logger from '~/service/LoggerService';
import UnifiedRepositoryClass from './UnifiedRepository';
import createId, { createNanoId } from '~/utils/create-id';
import mongoose, { Schema } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
import { RepositoryQueriesType } from '~/intf/types';
import { TestMode } from '~/conf';



/** Repository type. Reffers to the model interface */
type RepositoryType = IRole;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ id: query }, { slug: query }] };
};



const schema = new Schema<RepositoryType>({
  id: String,
  slug: String,
  name: String,
  permissions: [Schema.Types.Mixed],
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('role', schema);



interface ICreateProps {
  name: string
  slug: string

  /** Save the document in the database. @default true */
  saveDocument?: boolean
}



export class RoleRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);
  }

  get document(): RepositoryType | null {
    return this._doc ? DTOService.parse(this._doc) : null;
  }

  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this.update();

    Logger.debug(`[RoleRepository]: Document saved. [id: ${this._doc.id}; diff: ${this.diff.join('; ')}]`);
  }



  /** @todo Detach name and slug specification */
  async create({ name, slug, saveDocument }: ICreateProps): Promise<RepositoryType> {
    saveDocument = saveDocument ?? true;

    const id = TestMode ? `~testing-${createNanoId()}` : createId();
    const exist = await this.safeGetOne(slug);
    if (exist) throw new NekoError('sys:already_exist', `Role with slug (${slug}) is already exist`);



    const payload: RepositoryType = {
      id,
      name,
      slug,
      permissions: [ROLE_PERMISSION.BASIC]
    };



    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[RoleRepository]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DTOService.parse(payload);
  }



  appendPermission(perm: ROLE_PERMISSION) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (this._doc.permissions.includes(perm)) return;

    this._doc.permissions.push(perm);
    this.diff.push(`Permission has been added: ${perm}`);
    this._doc.markModified('permissions');
  }



  removePermission(perm: ROLE_PERMISSION) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (!this._doc.permissions.includes(perm)) return;

    this._doc.permissions.filter(el => el !== perm);
    this.diff.push(`Permission has been removed: ${perm}`);
    this._doc.markModified('permissions');
  }
}



/**
 * Parse roles permissions
 */
export async function parseRolesPermissions(slugs: string[]): Promise<ROLE_PERMISSION[]> {
  const permissions: ROLE_PERMISSION[] = [];

  const roles = await RoleRepository.getMany({ slug: { $in: slugs } });

  roles.forEach(role => {
    role.permissions.forEach(perm => {
      if (!permissions.includes(perm)) permissions.push(perm);
    });
  });

  return permissions;
}



const RoleRepository = new RoleRepositoryClass();

export default RoleRepository;