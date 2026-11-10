
import { nanoid } from 'nanoid';
import { transliterate } from 'transliteration';
import z from 'zod';

import conf from '~/conf.js';
import TeamEntity, { CreateTeamSchema, ICreateTeamEntity, TeamSchema } from '~/domain/team.schema.js';
import { NUS_UPLOAD_TYPE } from '~/interfaces/external-api/INekomiUploadService.api.js';
import UnifiedRepositoryClass from '~/repositories/unified.repository.js';
import { NekoError } from '~/services/ExceptionService.js';
import Logger from '~/services/LoggerService.js';
import Mongo from '~/services/MongoDB.service.js';
import createId from '~/utils/create-id.js';
import createSlug from '~/utils/create-slug.js';
import replaceUpload from '~/utils/replace-upload.js';
import { getUTC } from '~/utils/utils.js';



type RepositoryType = TeamEntity // Repository object interface



const schema = TeamSchema; // General data schema
const collection = Mongo.collection('teams', schema); // Mongo collection



const l = {
  NAME_MAX_LENGTH: 40,
  ABOUT_TEXT_MAX_LENGTH: 5000,
  LINK_MAX_LENGTH: 128
};

export const TeamRepositoryValidators = {
  limits: l,

  name: z.string().nonempty().max(l.NAME_MAX_LENGTH),
  about_text: z.string().max(l.ABOUT_TEXT_MAX_LENGTH).nullable(),
  link: z.url().max(l.LINK_MAX_LENGTH).optional()
};



export class TeamRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  readonly RepositoryName = 'TeamRepository';



  constructor(
    emit = true
  ) { super(collection, schema, emit); }



  /** Insert single team entity document. Will initialize repository document */
  async insertOne(input: ICreateTeamEntity): Promise<RepositoryType> {
    const parsed = CreateTeamSchema.parse(input) as ICreateTeamEntity;

    // === Validate input
    parsed.name = TeamRepositoryValidators.name.parse(input.name);
    parsed.about = TeamRepositoryValidators.about_text.optional().parse(input.about) ?? undefined;
    parsed.avatar = TeamRepositoryValidators.link.optional().parse(input.avatar);
    parsed.cover = TeamRepositoryValidators.link.optional().parse(input.cover);
    parsed.socials = z.record(z.string(), z.url()).optional().parse(input.socials);
    parsed.support = z.record(z.string(), z.url()).optional().parse(input.support);

    const id = createId();
    let slug = createSlug(transliterate(parsed.name));

    const sameSlugDocument = await this.safeFindOneBySlug(slug);
    if (sameSlugDocument) slug = `${slug}-${nanoid(6)}`;

    // === Insert document
    const body: RepositoryType = {
      id,
      slug,
      name: parsed.name,
      about: parsed.about ?? null,
      avatar: parsed.avatar ?? conf.variables.default_avatar_url,
      cover: parsed.cover ?? conf.variables.default_team_cover_url,
      members: [],
      socials: parsed.socials ?? {},
      support: parsed.support ?? {},
      created_at: getUTC().ISO,
      updated_at: getUTC().ISO,
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



  /** Set team name & update them slug */
  async setName(name: string) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if name does not changed
    if (name === this._doc.name) return;

    // Validate input
    name = TeamRepositoryValidators.name.parse(name);

    let slug = createSlug(transliterate(name));

    const sameSlugDocument = await this.safeFindOneBySlug(slug);
    if (sameSlugDocument && sameSlugDocument.id !== this._doc.id) slug = `${slug}-${nanoid(6)}`; // Change slug if it is already reserved

    this._doc.name = name;
    this._doc.slug = slug;
  }



  /** Set team about text */
  setAbout(about: string | null) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if about text does not changed
    if (about === this._doc.about) return;

    // Validate input
    about = TeamRepositoryValidators.about_text.parse(about);

    // Assert about to null if it has no length
    if (about?.length === 0) about = null;

    this._doc.about = about;
  }



  /** Set team social link */
  setSocialLink(key: keyof TeamEntity['socials'], value: string | undefined) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if link does not changed
    if (this._doc.socials[key] === value) return;

    // Validate input
    value = TeamRepositoryValidators.link.parse(value);

    // TODO: Add domain validation

    this._doc.socials[key] = value;
  }



  /** Set team support link */
  setSupportLink(key: keyof TeamEntity['support'], value: string | undefined) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // Pass if link does not changed
    if (this._doc.support[key] === value) return;

    // Validate input
    value = TeamRepositoryValidators.link.parse(value);

    // TODO: Add domain validation

    this._doc.support[key] = value;
  }



  /** 
   * Upload and replace previous avatar with a new one.
   * 
   * @todo write tests
   * @returns CDNString
   */
  async uploadAvatar(buffer: Buffer, actorId: string): Promise<string> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return await replaceUpload(buffer, {
      actorId,
      uploadType: NUS_UPLOAD_TYPE.PHOTO_AVATAR,
      defaultUrl: conf.variables.default_avatar_url,
      previousUrl: this._doc.avatar
    });
  }



  /** 
   * Upload and replace previous cover with a new one.
   * 
   * @todo write tests
   * @returns CDNString
   */
  async uploadCover(buffer: Buffer, actorId: string): Promise<string> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return await replaceUpload(buffer, {
      actorId,
      uploadType: NUS_UPLOAD_TYPE.PHOTO_COVER,
      defaultUrl: conf.variables.default_team_cover_url,
      previousUrl: this._doc.cover
    });
  }
}



const TeamRepository = new TeamRepositoryClass(false);

export default TeamRepository;