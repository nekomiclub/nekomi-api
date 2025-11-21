import { HydratedDocument, Model } from 'mongoose';
import { RepositoryQueriesType } from '~/core/Interfaces/types';



/** Unified repository to provide CRUD access to models */
export default class UnifiedRepository<RepositoryType> {
  private _doc: HydratedDocument<RepositoryType> | undefined;
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
    if (!result) throw Error('INDEV_ERROR');

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
    await this.model.deleteOne({ uuid: id }, { id });
  }



  async deleteMany(id: string): Promise<void> {
    await this.model.deleteMany({ uuid: id }, { id });
  }



  /** @requires query specified in the constructor */
  async set<K extends keyof RepositoryType>(key: K, value: RepositoryType[K]) {
    if (!this._doc) throw new Error('INDEV_ERROR');

    // Write diff
    if (typeof value === 'string' || typeof value === 'number') this.diff.push(`[${String(key)}]: ${this._doc[key]} > ${value}`);
    else if (Array.isArray(value)) this.diff.push(`[${String(key)}]: ${(this._doc[key] as Array<any>).length} > ${(value as Array<any>).length}`);
    else this.diff.push(`[${String(key)}]: object changed`);

    this._doc.markModified(key);

    (this._doc as RepositoryType)[key] = value;
  }



  /** @requires query specified in the constructor */
  async save() {
    if (!this._doc) throw new Error('INDEV_ERROR');

    await this._doc.save();
  }
}