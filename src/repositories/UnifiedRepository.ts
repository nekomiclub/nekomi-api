import { HydratedDocument, Model, QueryFilter } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
import { RepositoryGetQueryType, RepositoryQueriesType } from '~/intf/types';



export class UnifiedModelClass<RepositoryType> {
  /** Current document */
  protected _doc: HydratedDocument<RepositoryType> | undefined;

  /** Changes diff */
  protected diff: string[] = [];



  constructor(
    protected readonly model: Model<RepositoryType>,
    protected readonly queries: (query: string) => RepositoryQueriesType<RepositoryType>,
  ) { }



  async init(query: RepositoryGetQueryType<RepositoryType>) {
    const document = await this.model.findOne(typeof query === 'string' ? this.queries(query) : query);
    if (!document) throw new NekoError('sys:not_found', `Document with query ${query} is not found`);

    this._doc = document;
  }



  /** @requires init() */
  protected set<K extends keyof RepositoryType>(key: K, value: RepositoryType[K]) {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    // TODO: Implement deep array/object diff

    // Write diff
    if (typeof value === 'string' || typeof value === 'number') this.diff.push(`[${String(key)}]: ${this._doc[key]} > ${value}`);
    else if (Array.isArray(value)) this.diff.push(`[${String(key)}]: ${(this._doc[key] as Array<any>)?.length} > ${(value as Array<any>)?.length}`);
    else this.diff.push(`[${String(key)}]: object changed`);

    this._doc.markModified(key);

    (this._doc as RepositoryType)[key] = value;
  }



  /** @requires init() */
  protected async update() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this._doc.save();
  }
}

/** Unified repository to provide CRUD access to models */
export default class UnifiedRepositoryClass<RepositoryType> extends UnifiedModelClass<RepositoryType> {
  constructor(
    /** MongoDB model */
    model: Model<RepositoryType>,

    /** Document find queries preserve function */
    queries: (query: string) => RepositoryQueriesType<RepositoryType>,
  ) {
    super(model, queries);
  }






  async getOne(query: RepositoryGetQueryType<RepositoryType>): Promise<RepositoryType> {
    const result = await this.model.findOne(typeof query === 'string' ? this.queries(query) : query);
    if (!result) throw new NekoError('sys:not_found', `Document with query ${query} is not found`);

    return result;
  }



  async getMany(query: RepositoryGetQueryType<RepositoryType>): Promise<RepositoryType[]> {
    const results = await this.model.find(typeof query === 'string' ? this.queries(query) : query);

    return results;
  }



  async safeGetOne(query: RepositoryGetQueryType<RepositoryType>): Promise<RepositoryType | null> {
    try {
      return await this.getOne(query);
    } catch (e) {
      return null;
    }
  }



  /** @deprecated use getOne instead */
  async getOneByQuery(query: QueryFilter<keyof RepositoryType>): Promise<RepositoryType | null> {
    const result = await this.model.findOne(query);

    return result;
  }



  /** @deprecated use getMany instead */
  async getManyByQuery(query: QueryFilter<keyof RepositoryType>): Promise<RepositoryType[]> {
    const results = await this.model.find(query);

    return results;
  }



  async getAll(): Promise<RepositoryType[]> {
    return await this.model.find();
  }



  async deleteOne(query: RepositoryGetQueryType<RepositoryType>): Promise<void> {
    await this.model.deleteOne(typeof query === 'string' ? { id: query } : query);
  }



  async deleteMany(query: RepositoryGetQueryType<RepositoryType>): Promise<void> {
    await this.model.deleteMany(typeof query === 'string' ? { id: query } : query);
  }
}