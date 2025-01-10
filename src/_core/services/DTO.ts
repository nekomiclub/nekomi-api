import { HydratedDocument } from 'mongoose';
import { IDubber } from '../interfaces/IDubber';



interface IMongoDTOProps<DOC> {
  document: HydratedDocument<DOC>
  details?: boolean
}

interface IDocumentDTOProps<INT> {
  object: INT
  details?: boolean
}



function excludeKeys<INT>(object: object, exclude: string[]): INT {
  const instance = { ...object } as INT;

  for (const key in object) {
    if (exclude.includes(key)) {
      instance[key] = undefined;
    }
  }

  return instance;
}



export class MongoDocumentDTO {
  private DTO<INT>(document: object): INT {
    return excludeKeys(document, ['_id', '__v']);
  }

  dubber({ document, details }: IMongoDTOProps<IDubber>): IDubber {
    return this.DTO<IDubber>(new DocumentDTO().dubber({ object: document.toObject(), details }));
  }
}

export class DocumentDTO {
  private DTO<INT>(object: object, exclude: string[]): INT {
    return excludeKeys(object, exclude);
  }

  dubber({ object, details }: IDocumentDTOProps<IDubber>): IDubber {
    const keys: (keyof IDubber)[] = [
      'members',
      'membersInvited',
    ];

    return this.DTO<IDubber>(object, details ? [] : keys);
  }
}