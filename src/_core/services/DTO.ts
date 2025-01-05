import { HydratedDocument } from 'mongoose';
import { IDubber } from '../interfaces/IDubber';



interface IMongodbDocument {
  __v: number,
  _id: any,
  [key: string]: any
}

interface IDTOProps<DOC> {
  document: HydratedDocument<DOC>
  details?: boolean
}



export class MongoDocumentDTO {
  private DTO<DOC>(document: IMongodbDocument, exclude: string[]): DOC {
    const instance = { ...document } as DOC;

    exclude.push('_id');
    exclude.push('__v');

    for (const key in document) {
      if (exclude.includes(key)) {
        instance[key] = undefined;
      }
    }

    return instance;
  }

  dubber({ document, details }: IDTOProps<IDubber>): IDubber {
    const keys: (keyof IDubber)[] = [
      'members',
      'membersInvited',
    ];

    return this.DTO(document.toObject(), details ? [] : keys);
  }
}