import AnimeService from './AnimeService';
import TogetherModel from '~/core/models/TogetherModel';
import TogetherRoom from '~/core/interfaces/Together';
import UserService from './UserService';
import createID, { createUUID } from '~/utils/create-id';
import { E404 } from '~/services/ErrorService';
import { ERROR_BASE_NO_DOCUMENT } from '~/services/Exceptions';
import { HydratedDocument } from 'mongoose';
import { Logger } from '~/services/LoggerService';
import { MongoDocumentDTO } from './DTO';
import { ServiceControls } from '~/core/interfaces/types';



interface TogetherCreateProps {
  animeId: string
  ownerId: string

  /** Specifies if document will be saved. @default true */
  savedoc?: boolean
}

type TogetherModelControlsType = ServiceControls<TogetherCreateProps, TogetherRoom>



class TogetherModelControls implements TogetherModelControlsType {
  async create({ animeId, ownerId, savedoc }: TogetherCreateProps): Promise<TogetherRoom> {
    savedoc = savedoc ?? true;

    const id = createUUID();
    let slug = createID(8);

    // Rewrite slug if it's already exist
    const existRoom = await this.safeGetByQuery(slug);
    if (existRoom) slug = createID(14);

    // Check if anime and user exist
    await new AnimeService().getById(animeId);
    await new UserService().getById(ownerId);



    const instance: TogetherRoom = {
      id,
      animeId,
      ownerId,
      slug: slug
    };

    const document = new TogetherModel(instance);

    if (savedoc) {
      await document.save();
      Logger.info(`[TogetherService]: New document was created. [id: ${id}]`);
    } else {
      Logger.warn(`[TogetherService]: New document was created but not saved. [id: ${id}]`);
    }

    return instance;
  }

  async deleteOne(id: string): Promise<void> {
    await TogetherModel.deleteOne({ id });

    Logger.info(`[TogetherService]: Single document was deleted. [id: ${id}]`);
  }

  async deleteMany(id: string): Promise<void> {
    const details = await TogetherModel.deleteMany({ id });

    Logger.info(`[TogetherService]: Some document were deleted. [id: ${id}; count: ${details.deletedCount}]`);
  }

  async getAll(details?: boolean): Promise<TogetherRoom[]> {
    const total = await TogetherModel.find();
    const list = total.map(document => {
      return new MongoDocumentDTO().together({ document, details });
    });

    return list;
  }

  async getById(id: string, details?: boolean): Promise<TogetherRoom> {
    const document = await TogetherModel.findOne({ id });
    if (!document) throw new E404(`Room with id (${id}) is not found`);

    return new MongoDocumentDTO().together({ document, details });
  }

  async getByQuery(query: string, details?: boolean): Promise<TogetherRoom> {
    const document = await TogetherModel.findOne({ $or: [{ id: query }, { slug: query }] });
    if (!document) throw new E404(`Room with query (${query}) is not found`);

    return new MongoDocumentDTO().together({ document, details });
  }

  async safeGetByQuery(query: string, details?: boolean): Promise<TogetherRoom | null> {
    try {
      return await this.getByQuery(query, details);
    } catch (e) { return null; }
  }
}



/** 
 * Brand-new implementation of database services
 * This service must be initialized by calling @method init()
*/
export class TogetherService extends TogetherModelControls {
  /** TO GET USER OBJECT USE get.user INSTEAD. THIS IS PRIVATE OBJECT */
  readonly document: HydratedDocument<TogetherRoom> | null = null;
  private stack: string[] = [];

  async init(query: string) {
    const document = await TogetherModel.findOne({ $or: [{ id: query }, { slug: query }] }); // Hydrated document required, find by built-in method is not possible
    if (!document) throw new E404(`Document ${query} is not found`);

    // @ts-expect-error Ignore readonly
    this.document = document;
  }

  /** Save the document
 * @returns current patch stack
 */
  async save(): Promise<string[]> {
    if (!this.document) throw ERROR_BASE_NO_DOCUMENT;

    try {
      await this.document.save();
    } catch (error) {
      Logger.debug(`[TogetherService]: Cannot save the document. Retrying after 1 second...`);

      await new Promise(res => {
        setTimeout(() => {
          res(1);
        }, 1000);
      });

      try {
        await this.document.save();
      } catch (e) {
        Logger.error(`[TogetherService]: Cannot save the document`, e);

        const stack = this.stack;
        this.stack = [];

        return stack;
      }
    }

    Logger.debug(`[TogetherService]: Document patched. [id: ${this.document.id}; changes: ${this.stack.length ? this.stack.join(', ') : 'none'}]`);

    this.stack = [];
    return this.stack;
  }

  get together(): TogetherRoom {
    if (!this.document) throw ERROR_BASE_NO_DOCUMENT;
    return new MongoDocumentDTO().together({ document: this.document, details: true });
  }
}