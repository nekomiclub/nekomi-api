import { DeleteResult } from 'mongodb';
import { nanoid } from 'nanoid';
import { transliterate } from 'transliteration';

import RoleEntity, { CreateRoleSchema, ICreateRoleEntity, ROLE_PERMISSION_ENUM, RoleSchema } from '~/domain/role.schema.js';
import UnifiedRepositoryClass from '~/repositories/unified.repository.js';
import { NekoError } from '~/services/ExceptionService.js';
import Logger from '~/services/LoggerService.js';
import Mongo from '~/services/MongoDB.service.js';
import createId from '~/utils/create-id.js';
import createSlug from '~/utils/create-slug.js';
import { joinStrings } from '~/utils/utils.js';



type RepositoryType = RoleEntity // Repository object interface



const schema = RoleSchema; // General data schema
const collection = Mongo.collection('roles', schema); // Mongo collection



export class RoleRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  readonly RepositoryName = 'RoleRepository';



  constructor(
    emit = true
  ) { super(collection, schema, emit); }



  /** Insert single role entity document. Will initialize repository document */
  async insertOne(input: ICreateRoleEntity): Promise<RepositoryType> {
    const parsed = CreateRoleSchema.parse(input) as ICreateRoleEntity;

    // === Insert document
    const id = createId();
    let slug = createSlug(transliterate(parsed.name));

    const sameSlugDocument = await this.safeFindOneBySlug(slug);
    if (sameSlugDocument) slug = `${slug}-${nanoid(6)}`;

    const body: RepositoryType = {
      id,
      slug,
      permissions: [ROLE_PERMISSION_ENUM.enum.BASIC],
      ...parsed
    };

    await this._insertOne(body);

    Logger.info(`[${this.RepositoryName}]: New document was created. [id=${body.id};name=${body.name}]`);

    return body;
  }



  findOneById(id: string) { return this.findOne({ id }); }
  findOneBySlug(slug: string) { return this.findOne({ slug }); }
  findOneByQuery(query: string) { return this.findOne({ $or: [{ id: query }, { slug: query }] }); }

  safeFindOneById(id: string) { return this.safeFindOne({ id }); }
  safeFindOneBySlug(slug: string) { return this.safeFindOne({ slug }); }
  safeFindOneByQuery(query: string) { return this.safeFindOne({ $or: [{ id: query }, { slug: query }] }); }



  async deleteOne(id: string): Promise<DeleteResult> {
    const result = await this._deleteOne({ id });

    Logger.verbose(`[${this.RepositoryName}]: Document was deleted. [id=${id}]`);

    return result;
  }



  async deleteMany(id?: string): Promise<DeleteResult> {
    const result = await this._deleteMany(id ? { id } : undefined);

    Logger.verbose(`[${this.RepositoryName}]: Many documents were deleted. [${joinStrings(id && `id=${id};`, `count=${result.deletedCount}`)}]`);

    return result;
  }



  /** Append new role permission */
  appendPermission(slug: ROLE_PERMISSION_ENUM) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Continue if permission already in
    if (this._doc.permissions.includes(slug)) return;

    // Ensure that requested permission exists
    ROLE_PERMISSION_ENUM.parse(slug);

    this._doc.permissions.push(slug);
  }



  /** Revoke role permission */
  revokePermission(slug: ROLE_PERMISSION_ENUM) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Continue if permission is not included
    if (!this._doc.permissions.includes(slug)) return;

    if (slug === ROLE_PERMISSION_ENUM.enum.BASIC) throw new NekoError('sys:action_prevented', 'Cannot remove basic role permisison');

    this._doc.permissions = this._doc.permissions.filter(el => el !== slug);
  }



  /** Get permissions from role slugs */
  async getPermissions(slugs: string[]): Promise<ROLE_PERMISSION_ENUM[]> {
    const roles = await this.find({ slug: { $in: slugs } });
    const permissions = new Set<ROLE_PERMISSION_ENUM>();

    roles.forEach(role => {
      role.permissions.forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
  }
}



const RoleRepository = new RoleRepositoryClass(false);

export default RoleRepository;