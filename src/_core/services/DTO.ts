import { Anime } from '~/core/interfaces/Anime.intf';
import { HydratedDocument } from 'mongoose';
import { IDubber } from '~/core/interfaces/Dubber.intf';
import { User } from '~/core/interfaces/User.intf';



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

  user({ document, details }: IMongoDTOProps<User>): User {
    return this.DTO<User>(new DocumentDTO().user({ object: document.toObject(), details }));
  }

  anime({ document, details }: IMongoDTOProps<Anime>): Anime {
    return this.DTO<Anime>(new DocumentDTO().anime({ object: document.toObject(), details }));
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

  user({ object, details }: IDocumentDTOProps<User>): User {
    const keys: (keyof User)[] = [
      'roles',
      'statistics',
      'libs',
      'watchProgress',
      'telegramLinkToken',
      'subscribes',
      'telegramData'
    ];

    return this.DTO<User>(object, details ? [] : keys);
  }

  anime({ object, details }: IDocumentDTOProps<Anime>): Anime {
    const keys: (keyof Anime)[] = [
      'episodes',
      'episodesMeta',
      'updatedAt',
      'createdAt',
      'related',
      'malSyncedAt',
      'stopSync',
    ];

    return this.DTO<Anime>(object, details ? [] : keys);
  }
}