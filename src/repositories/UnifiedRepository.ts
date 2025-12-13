import { HydratedDocument, Model } from 'mongoose';
import { NekoError } from '~/service/ExceptionService';
import { RepositoryQueriesType } from '~/intf/types';



/** Unified repository to provide CRUD access to models */
export default class UnifiedRepositoryClass<RepositoryType> {
  /** Current document */
  protected _doc: HydratedDocument<RepositoryType> | undefined;

  /** Changes diff */
  readonly diff: string[] = [];



  constructor(
    /** MongoDB model */
    protected readonly model: Model<RepositoryType>,

    /** Document find queries preserve function */
    private readonly queries: (query: string) => RepositoryQueriesType<RepositoryType>,

    /** Document query */
    query?: string,
  ) {
    if (query) {
      new Promise(res => {
        (async function () {
          this._doc = await model.findOne(this.queries(query));
          res(1);
        })();
      });
    }
  }



  async getOne(query: string): Promise<RepositoryType> {
    const result = await this.model.findOne(this.queries(query));
    if (!result) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    return result;
  }



  async safeGetOne(query: string): Promise<RepositoryType | null> {
    const result = await this.model.findOne(this.queries(query));

    return result;
  }



  async getMany(query: string): Promise<RepositoryType[]> {
    const results = await this.model.find(this.queries(query));

    return results;
  }



  async getAll(): Promise<RepositoryType[]> {
    return await this.model.find();
  }



  async deleteOne(id: string): Promise<void> {
    await this.model.deleteOne({ id });
  }



  async deleteMany(id: string): Promise<void> {
    await this.model.deleteMany({ id });
  }



  /** @requires query specified in the constructor */
  protected async set<K extends keyof RepositoryType>(key: K, value: RepositoryType[K]) {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    // TODO: Implement deep array/object diff

    // Write diff
    if (typeof value === 'string' || typeof value === 'number') this.diff.push(`[${String(key)}]: ${this._doc[key]} > ${value}`);
    else if (Array.isArray(value)) this.diff.push(`[${String(key)}]: ${(this._doc[key] as Array<any>).length} > ${(value as Array<any>).length}`);
    else this.diff.push(`[${String(key)}]: object changed`);

    this._doc.markModified(key);

    (this._doc as RepositoryType)[key] = value;
  }



  /** @requires query specified in the constructor */
  protected async update() {
    if (!this._doc) throw new NekoError('ERROR_DOCUMENT_NOT_INITIALIZED');

    await this._doc.save();
  }
}