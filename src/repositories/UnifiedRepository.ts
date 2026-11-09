import DTS from '~/services/DataTransferService.js';
import Logger from '~/services/LoggerService.js';
import { HydratedDocument, Model, SortOrder } from 'mongoose';
import { NekoError } from '~/services/ExceptionService.js';
import { NestedKey, RepositoryGetQueryType, RepositoryQueriesType, ValueFromPath } from '~/interfaces/types.js';
import { excludeValuesFromArray } from '~/utils/utils.js';



interface ISaveProps {
  id: string

  /** Save document without diff writing */
  saveOnly?: boolean
}

interface IGetTopOfManyProps<T> {
  limit: number

  sort?: {
    [key: string]: SortOrder
  } & {
    [K in keyof T]?: SortOrder
  }
}



/** Unified model @deprecated */
export class UnifiedModelClass<RepositoryType> {
  protected RepositoryName = 'UnifiedRepository (unassigned)';

  /** Current document */
  protected _doc: HydratedDocument<RepositoryType> | undefined;

  /** Changes diff */
  protected _diff: string[] = [];



  constructor(
    protected readonly model: Model<RepositoryType>,
    protected readonly queries: (query: string) => RepositoryQueriesType<RepositoryType>,
  ) { }



  public async init(query: RepositoryGetQueryType<RepositoryType>) {
    const document = await this.model.findOne(this.query2find(query));
    if (!document) throw new NekoError('sys:not_found', `Entity "${JSON.stringify(query)}" is not found`);

    this._doc = document;
  }



  /** 
   * Implicit document value setter
   * Using it outside repository violates safe repository usage
   * 
   * @requires init()
   */
  _set<K extends NestedKey<RepositoryType>>(_key: K, value: ValueFromPath<RepositoryType, K> | undefined, props?: { dropDiffWrite?: boolean }) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const key = String(_key);
    const parts = key.split('.') as string[];



    if (parts.length === 1) {
      // Primitives & arrays

      if (typeof value === 'string' || typeof value === 'number' || value === undefined || value === null) {
        // Write primitives diff
        const prev = this._doc[key];
        if (prev === value) return; // Nothing changed

        if (!props?.dropDiffWrite) this._diff.push(`[${String(key)}]: ${prev} > ${value}`);
      }
      else if (Array.isArray(value)) {
        // Write array diff
        const excluded = excludeValuesFromArray(this._doc[key], value);
        const appended = excludeValuesFromArray(value, this._doc[key]);

        const msg: string[] = [];

        if (appended.length) msg.push(`Appended: ${appended.join(', ')}`);
        if (excluded.length) msg.push(`Excluded: ${excluded.join(', ')}`);
        if (!msg.length) return; // Nothing changed

        if (!props?.dropDiffWrite) this._diff.push(`[${String(key)}]: ${msg.join('; ')}`);
      }

      this._doc.markModified(key);
      (this._doc as any)[parts[0]] = value;
    } else {
      // Objects

      const [parent, child] = parts;
      const prev = this._doc[parent][child];
      if (prev === value) return; // Nothing changed

      if (!props?.dropDiffWrite) this._diff.push(`[${String(key)}]: ${prev} > ${value}`);

      this._doc.markModified(parent);
      (this._doc as any)[parent][child] = value;
    }
  }



  /** 
   * Save the document
   * To default save use {this._save} instead
   * 
   * @requires init()
   */
  protected async _update() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this._doc.save();
  }



  /** 
   * Save the document and write logs
   * 
   * @requires init()
   */
  protected async _save({ saveOnly, id }: ISaveProps) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this._update();

    if (!saveOnly) {
      Logger.debug(`[${this.RepositoryName}]: Document saved. [id: ${id}; diff: ${this.preserveDiff()}]`);

      this._diff = [];
    } else {
      Logger.debug(`[${this.RepositoryName}]: Document saved silently. [id: ${id}]`);
    }
  }



  protected query2find(query?: RepositoryGetQueryType<RepositoryType>) {
    return typeof query === 'string' ? this.queries(query) : query;
  }



  protected preserveDiff() {
    return this._diff.length ? this._diff.join(', ') : 'Nothing changed';
  }
}



/** Unified repository to provide CRUD access to models */
export default class UnifiedRepositoryClass<RepositoryType> extends UnifiedModelClass<RepositoryType> {
  /**
   * Get single document with query
   * 
   * @throws {404} if not found
   */
  async getOne(query: RepositoryGetQueryType<RepositoryType>): Promise<RepositoryType> {
    const result = await this.model.findOne(this.query2find(query));
    if (!result) throw new NekoError('sys:not_found', `Document with query ${JSON.stringify(query)} is not found`);

    return DTS.parse(result);
  }



  /** 
   * Get many documents with query
   * To sort or limit output use {this.getSortedMany} as more efficient method
   */
  async getMany(query?: RepositoryGetQueryType<RepositoryType>): Promise<RepositoryType[]> {
    const results = await this.model.find(this.query2find(query));

    return results.map(el => DTS.parse(el));
  }



  /** Get many sorted documents with limit */
  async getSortedMany(query: RepositoryGetQueryType<RepositoryType> | undefined, { limit, sort }: IGetTopOfManyProps<RepositoryType>): Promise<RepositoryType[]> {
    const results = await this.model.find(this.query2find(query)).sort(sort).limit(limit);

    return results.map(el => DTS.parse(el));
  }



  /** Similar to {this.getOne}, but without error throwing on not found */
  async safeGetOne(query: RepositoryGetQueryType<RepositoryType>): Promise<RepositoryType | null> {
    try {
      return await this.getOne(query);
    } catch (e) {
      return null;
    }
  }



  /** Delete single document matching query */
  async deleteOne(query: RepositoryGetQueryType<RepositoryType>): Promise<void> {
    await this.model.deleteOne(this.query2find(query));
  }



  /** Delete many documents matching query */
  async deleteMany(query: RepositoryGetQueryType<RepositoryType>): Promise<void> {
    await this.model.deleteMany(this.query2find(query));
  }
}