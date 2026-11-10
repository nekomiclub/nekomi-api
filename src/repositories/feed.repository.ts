import { DeleteResult } from 'mongodb';

import { CreateFeedSchema, FeedEntity, FeedSchema, ICreateFeedEntitySchema } from '~/domain/feed.schema.js';
import AnimeRepository from '~/repositories/AnimeRepository.js';
import UnifiedRepositoryClass from '~/repositories/unified.repository.js';
import { NekoError } from '~/services/ExceptionService.js';
import Logger from '~/services/LoggerService.js';
import Mongo from '~/services/MongoDB.service.js';
import { joinStrings } from '~/utils/utils.js';



type RepositoryType = FeedEntity // Repository object interface



const schema = FeedSchema; // General data schema
const collection = Mongo.collection('feeds', schema); // Mongo collection



export class FeedRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  readonly RepositoryName = 'FeedRepository';



  constructor(
    emit = true
  ) { super(collection, schema, emit); }



  /** Insert single feed entity document. Will initialize repository document */
  async insertOne(input: ICreateFeedEntitySchema): Promise<RepositoryType> {
    const parsed = CreateFeedSchema.parse(input);

    // === Validate input
    const existFeedDocument = await this.safeFindOneByAnimeId(parsed.anime_id);
    if (existFeedDocument) throw new NekoError('sys:already_exist', `Feed entity with anime_id "${parsed.anime_id}" is already exist`);

    const existAnimeDocument = await AnimeRepository.safeGetOne(parsed.anime_id);
    if (!existAnimeDocument) throw new NekoError('sys:not_found', `Anime entity with id "${parsed.anime_id}" is not found`);

    // === Insert documnent
    const body: RepositoryType = parsed;
    await this._insertOne(body);

    Logger.info(`[${this.RepositoryName}]: New document was created. [anime_id=${body.anime_id}]`);

    return body;
  }



  findOneByAnimeId(anime_id: string) { return this.findOne({ anime_id }); }
  safeFindOneByAnimeId(anime_id: string) { return this.safeFindOne({ anime_id }); }



  async deleteOne(anime_id: string): Promise<DeleteResult> {
    const result = await this._deleteOne({ anime_id });

    Logger.verbose(`[${this.RepositoryName}]: Document was deleted. [anime_id=${anime_id}]`);

    return result;
  }



  async deleteMany(anime_id?: string): Promise<DeleteResult> {
    const result = await this._deleteMany(anime_id ? { anime_id } : undefined);

    Logger.verbose(`[${this.RepositoryName}]: Many documents were deleted. [${joinStrings(anime_id && `anime_id=${anime_id};`, `count=${result.deletedCount}`)}]`);

    return result;
  }
}



const FeedRepository = new FeedRepositoryClass(false);

export default FeedRepository;