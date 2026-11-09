import Mongo from '~/services/MongoDB.service.js';
import { FeedSchema, FeedEntity, ICreateFeedEntitySchema, CreateFeedSchema } from '~/domain/feed.schema.js';
import { NekoError } from '~/services/ExceptionService.js';
import { DeleteResult, WithId } from 'mongodb';
import AnimeRepository from '~/repositories/AnimeRepository.js';
import Logger from '~/services/LoggerService.js';
import DTS from '~/services/DataTransferService.js';
import { joinStrings } from '~/utils/utils.js';



type RepositoryType = FeedEntity // Repository object interface
type RepositoryTypeWithId = WithId<RepositoryType>



const schema = FeedSchema; // General data schema
const collection = Mongo.collection('feeds', schema); // Mongo collection



export class FeedRepositoryClass {
  readonly RepositoryName = 'FeedRepository';

  /** Repository document */
  private _doc: RepositoryType | undefined;



  constructor(
    /** Allow _doc mutations */
    private emit = true
  ) { }



  /** 
   * Get the current repository document
   * 
   * @tested
   */
  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return DTS.parse(this._doc);
  }



  /** 
   * Insert single feed entity document. Will initialize repository document
   * 
   * @tested
   */
  async insertOne(input: ICreateFeedEntitySchema): Promise<RepositoryType> {
    const parsed = CreateFeedSchema.parse(input);

    // === Validate input
    const existFeedDocument = await this.safeFindOne(parsed.anime_id);
    if (existFeedDocument) throw new NekoError('sys:already_exist', `Feed entity with anime_id "${parsed.anime_id}" is already exist`);

    const existAnimeDocument = await AnimeRepository.safeGetOne(parsed.anime_id);
    if (!existAnimeDocument) throw new NekoError('sys:not_found', `Anime entity with id "${parsed.anime_id}" is not found`);

    // === Insert documnent
    const body: FeedEntity = {
      ...parsed
    };

    await collection.insertOne(body);

    Logger.info(`[${this.RepositoryName}]: New document has been created! [anime_id: ${body.anime_id}]`);
    if (this.emit) this._doc = body;

    return DTS.parse(body);
  }



  /** Get single feed entity document by it's anime_id */
  async findOne(anime_id: string): Promise<RepositoryType> {
    const document = await collection.findOne({ anime_id });
    if (!document) throw new NekoError('sys:not_found', `Feed entity with anime_id "${anime_id}" is not found`);

    const parsed = DTS.parse(schema.parse(document));

    return parsed;
  }



  /** Get many documents with matching anime_id */
  async findMany(): Promise<RepositoryType[]> {
    const documents = await collection.find().toArray();

    const parsed: RepositoryType[] = documents.map(el => DTS.parse(schema.parse(el)));

    return parsed;
  }



  /** Get single feed entity without not found error */
  async safeFindOne(anime_id: string): Promise<RepositoryType | null> {
    try {
      return await this.findOne(anime_id);
    } catch (e) {
      return null;
    }
  }



  /** Delete single feed entity by anime id */
  async deleteOne(anime_id: string): Promise<DeleteResult> {
    const result = await collection.deleteOne({ anime_id });

    Logger.verbose(`[${this.RepositoryName}]: Deleted feed entity with anime_id "${anime_id}"`);

    return result;
  }



  /** Delete many feed entities by anime id or nothing */
  async deleteMany(anime_id?: string): Promise<DeleteResult> {
    const result = await collection.deleteMany(anime_id ? { anime_id } : undefined);

    Logger.verbose(joinStrings(`[${this.RepositoryName}]: Deleted ${result.deletedCount} feed entities`, anime_id && `with anime_id "${anime_id}"`));

    return result;
  }
}



const FeedRepository = new FeedRepositoryClass(false);

export default FeedRepository;  