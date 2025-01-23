import { HydratedDocument } from 'mongoose';
import { IDubber } from '../Interfaces/IDubber';
import { ITitle } from '~/interfaces/ITitle';
import { IUser } from '~/interfaces/IUser';



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

  user({ document, details }: IMongoDTOProps<IUser>): IUser {
    return this.DTO<IUser>(new DocumentDTO().user({ object: document.toObject(), details }));
  }

  anime({ document, details }: IMongoDTOProps<ITitle>): ITitle {
    return this.DTO<ITitle>(new DocumentDTO().anime({ object: document.toObject(), details }));
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

  user({ object, details }: IDocumentDTOProps<IUser>): IUser {
    const keys: (keyof IUser)[] = [
      'roles',
      'statistics',
      'libs',
      'watchProgress',
      'telegramLinkToken',
      'subscribes',
      'togetherRooms',
      'telegramData'
    ];

    return this.DTO<IUser>(object, details ? [] : keys);
  }

  anime({ object, details }: IDocumentDTOProps<ITitle>): ITitle {
    const keys: (keyof ITitle)[] = [
      'episodes',
      'episodesMeta'
    ];

    return this.DTO<ITitle>(object, details ? [] : keys);
  }
}