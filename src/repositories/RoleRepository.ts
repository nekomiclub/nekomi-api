import DTS from '~/services/DataTransferService.js';
import IRole, { ROLE_PERMISSION_ENUM } from '~/domain/role.schema.js';
import Logger from '~/services/LoggerService.js';
import UnifiedRepositoryClass from './UnifiedRepository.js';
import createId, { createNanoId } from '~/utils/create-id.js';
import mongoose, { Schema } from 'mongoose';
import { NekoError } from '~/services/ExceptionService.js';
import { RepositoryQueriesType } from '~/interfaces/types.js';
import { asRoleId } from '~/interfaces/BrandedIds.js';
import { isTesting } from '~/conf.js';



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

const model = mongoose.model<RepositoryType>('roles', schema);



interface ICreateProps {
  name: string
  slug: string

  /** Save the document in the database. @default true */
  saveDocument?: boolean
}



export class RoleRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor() {
    super(model, queries);

    this.RepositoryName = 'RoleRepository';
  }

  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return DTS.parse(this._doc);
  }



  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this._save({ id: this._doc.id });
  }



  /** @todo Detach name and slug specification */
  async create({ name, slug, saveDocument }: ICreateProps): Promise<RepositoryType> {
    saveDocument = saveDocument ?? true;

    const id = asRoleId(isTesting ? `~testing-${createNanoId()}` : createId());
    const exist = await this.safeGetOne(slug);
    if (exist) throw new NekoError('sys:already_exist', `Role with slug (${slug}) is already exist`);



    const payload: RepositoryType = {
      id,
      name,
      slug,
      permissions: [ROLE_PERMISSION_ENUM.enum.BASIC]
    };



    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[${this.RepositoryName}]: New document has been created! [id: ${id}]`);
    this._doc = document;

    return DTS.parse(payload);
  }



  appendPermission(perm: ROLE_PERMISSION_ENUM) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (this._doc.permissions.includes(perm)) return;

    this._doc.permissions.push(perm);
    this._diff.push(`Permission has been added: ${perm}`);
    this._doc.markModified('permissions');
  }



  removePermission(perm: ROLE_PERMISSION_ENUM) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    if (!this._doc.permissions.includes(perm)) return;

    this._doc.permissions.filter(el => el !== perm);
    this._diff.push(`Permission has been removed: ${perm}`);
    this._doc.markModified('permissions');
  }
}



/**
 * Parse roles permissions
 */
export async function parseRolesPermissions(slugs: string[]): Promise<ROLE_PERMISSION_ENUM[]> {
  const permissions: ROLE_PERMISSION_ENUM[] = [];

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