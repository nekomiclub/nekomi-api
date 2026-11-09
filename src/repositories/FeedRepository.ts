import AnimeRepository from '~/repositories/AnimeRepository.js';
import DTS from '~/services/DataTransferService.js';
import Logger from '~/services/LoggerService.js';
import UnifiedRepositoryClass from './UnifiedRepository.js';
import mongoose, { Schema } from 'mongoose';
import { IFeed } from '~/domain/feed.schema.js';
import { NekoError } from '~/services/ExceptionService.js';
import { RepositoryQueriesType } from '~/interfaces/types.js';



/** Repository type. Reffers to the model interface */
type RepositoryType = IFeed;

const queries = (query: string): RepositoryQueriesType<RepositoryType> => {
  return { $or: [{ anime_id: query }] };
};



const schema = new Schema<RepositoryType>({
  anime_id: String,
  cover_url: String,
  video_url: String
}, { strict: false, versionKey: false });

const model = mongoose.model<RepositoryType>('feeds', schema);



interface IConstructorProps {
  _?: any
}

interface ISaveProps {
  /** Save document without diff writing */
  saveOnly?: boolean
}



interface ICreateProps {
  /** Save the document in the database. @default true */
  saveDocument?: boolean
}



export class FeedRepositoryClass extends UnifiedRepositoryClass<RepositoryType> {
  constructor(props?: IConstructorProps) {
    super(model, queries);

    this.RepositoryName = 'FeedRepository';
  }



  async save() {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this._doc.save();
  }



  get document(): RepositoryType {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    return DTS.parse(this._doc);
  }



  async deleteOne(): Promise<void> {
    if (!this._doc) throw new NekoError('sys:document_not_initialized');

    await this._doc?.deleteOne();
  }



  /** @unavailable */
  async deleteMany(): Promise<void> {
    throw new NekoError('sys:not_implemented', `Method is unavailable`);
  }



  /** 
   * Creates new feed document and initialize service part of repository
   */
  async create(props: ICreateProps & RepositoryType): Promise<RepositoryType> {
    const saveDocument = props?.saveDocument ?? true;

    const existFeedDocument = await this.safeGetOne(props.anime_id);
    if (existFeedDocument) throw new NekoError('sys:already_exist');

    const existAnimeDocument = await AnimeRepository.safeGetOne(props.anime_id);
    if (!existAnimeDocument) throw new NekoError('sys:not_found');



    const payload: RepositoryType = {
      anime_id: props.anime_id,
      cover_url: props.cover_url,
      video_url: props.video_url,
    };

    const document = new model(payload);
    if (saveDocument) await document.save();

    Logger.info(`[${this.RepositoryName}]: New document has been created! [anime_id: ${props.anime_id}]`);
    this._doc = document;

    return DTS.parse(payload);
  }
}



const FeedRepository = new FeedRepositoryClass();

export default FeedRepository;