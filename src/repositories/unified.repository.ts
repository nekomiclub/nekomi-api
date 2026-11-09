import { Collection, DeleteResult, Filter, InsertManyResult, InsertOneResult, OptionalUnlessRequiredId, Sort, UpdateResult, WithId } from 'mongodb';
import { ZodObject } from 'zod';

import DTS from '~/services/DataTransferService.js';
import { NekoError } from '~/services/ExceptionService.js';



type IFindArgs = {
  sort?: Sort
  limit?: number
}



/** 
 * Unified mongo collection class
 * Provides internal document initialization & values update
 */
export class UnifiedCollectionClass<RepositoryType extends object> {
  protected RepositoryName = 'UnifiedRepository (unassigned)';
  protected _doc: WithId<RepositoryType> | undefined;



  constructor(
    protected readonly collection: Collection<RepositoryType>,
    protected readonly schema: ZodObject
  ) { }



  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return DTS.parse(this._doc);
  }



  /** Initialize internal document to mutate it data */
  async init(filter: Filter<RepositoryType>): Promise<RepositoryType> {
    const document = await this.collection.findOne(filter);
    if (!document) throw new NekoError('sys:not_found', `Cannot initialize repository`);

    this._doc = document;

    return DTS.parse(document);
  }



  /** Save internal document in the database */
  async _save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    const { _id, ...data } = this._doc;

    const parsed = this.schema.parse(data) as RepositoryType;

    const result = await this.collection.replaceOne({ _id } as Filter<RepositoryType>, parsed);
    if (!result.matchedCount) throw new NekoError('sys:modify_conflict');

    return result;
  }
}



/**
 * Unified repository class
 * Provides CRUD access to mongodb & data validation
 */
class UnifiedRepositoryClass<RepositoryType extends object> extends UnifiedCollectionClass<RepositoryType> {
  constructor(
    protected readonly collection: Collection<RepositoryType>,
    protected readonly schema: ZodObject,

    /** Whether to should emit internal document on insertOne */
    private emit = true,
  ) { super(collection, schema); }

  /** Insert single document */
  async _insertOne(input: RepositoryType): Promise<InsertOneResult<RepositoryType>> {
    const parsed = this.schema.parse(input) as OptionalUnlessRequiredId<RepositoryType>;

    const inserted = await this.collection.insertOne(parsed);

    if (this.emit) this._doc = {
      _id: inserted.insertedId,
      ...parsed
    } as WithId<RepositoryType>;

    return inserted;
  }



  /** Insert many document */
  async _insertMany(inputs: RepositoryType[]): Promise<InsertManyResult<RepositoryType>> {
    const parsed = inputs.map(el => this.schema.parse(el)) as OptionalUnlessRequiredId<RepositoryType>[];

    return await this.collection.insertMany(parsed);
  }



  /** Get documents by filter matching limiting & sorting */
  async _find(filter: Filter<RepositoryType>, args?: IFindArgs) {
    const cursor = this.collection.find(filter);

    if (args?.sort) cursor.sort(args.sort);
    if (args?.limit) cursor.limit(args.limit);

    const documents = await cursor.toArray();

    const parsed = documents.map(el => DTS.parse(this.schema.parse(el))) as RepositoryType[];

    return parsed;
  }



  /** Get single document matching filter */
  async _findOne(filter: Filter<RepositoryType>): Promise<RepositoryType> {
    const document = await this.collection.findOne(filter);
    if (!document) throw new NekoError('sys:not_found', `Requested document is not found`);

    const parsed = DTS.parse(this.schema.parse(document));

    return parsed;
  }



  /** Get single document matching filter and preserved error */
  async _safeFindOne(filter: Filter<RepositoryType>): Promise<RepositoryType | null> {
    try {
      return await this._findOne(filter);
    } catch (e) {
      return null;
    }
  }



  /** Delete single document matching filter */
  async _deleteOne(filter: Filter<RepositoryType>): Promise<DeleteResult> {
    return await this.collection.deleteOne(filter);
  }



  /** Delete many documents matching filter */
  async _deleteMany(filter: Filter<RepositoryType>): Promise<DeleteResult> {
    return await this.collection.deleteMany(filter);
  }



  /** Replace single document matching filter */
  async _replaceOne(filter: Filter<RepositoryType>, input: RepositoryType): Promise<UpdateResult<RepositoryType>> {
    const parsed = this.schema.parse(input) as RepositoryType;

    return await this.collection.replaceOne(filter, parsed);
  }
}

export default UnifiedRepositoryClass;