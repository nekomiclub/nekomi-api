import { Anime } from '~/core/interfaces/Anime.intf';
import { Dubber } from '~/core/interfaces/Dubber.intf';
import { HydratedDocument } from 'mongoose';
import { User } from '~/core/interfaces/User.intf';



function excludeKeys<INT>(object: object, exclude: string[]): INT {
  const instance = { ...object } as INT;

  exclude.push('_id');
  exclude.push('__v');

  for (const key in object) {
    if (exclude.includes(key)) {
      instance[key] = undefined;
    }
  }

  return instance;
}



export default class DocumentDTO {
  static anime(object: HydratedDocument<Anime> | Anime, exposed?: boolean): Anime {
    const keys: (keyof Anime)[] = [
      'episodes',
      'episodesMeta',
      'updatedAt',
      'createdAt',
      'related',
      'malSyncedAt',
      'stopSync',
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }

  static dubber(object: HydratedDocument<Dubber> | Dubber, exposed?: boolean): Dubber {
    const keys: (keyof Dubber)[] = [
      'members',
      'membersInvited',
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }

  static user(object: HydratedDocument<User> | User, exposed?: boolean): User {
    const keys: (keyof User)[] = [
      'roles',
      'statistics',
      'libs',
      'watchProgress',
      'telegramLinkToken',
      'subscribes',
      'telegramData'
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }
}