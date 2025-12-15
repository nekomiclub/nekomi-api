import IAnime from '~/intf/IAnime';
import IDubber from '~/intf/IDubber';
import IUser from '~/intf/IUser';
import { HydratedDocument } from 'mongoose';



function excludeKeys<T>(object: object, exclude: string[]): T {
  const instance = { ...object } as T;

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
  static anime(object: HydratedDocument<IAnime> | IAnime, exposed?: boolean): IAnime {
    const keys: (keyof IAnime)[] = [
      'posters',
      'relations',
      'pictures',
      'episodes',
      'episodes_meta',
      'updated_at',
      'created_at',
      'hikka_sync',
      'myanimelist_sync',
      'shikimori_sync',
      'is_DMCA_restricted',
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }

  static dubber(object: HydratedDocument<IDubber> | IDubber, exposed?: boolean): IDubber {
    const keys: (keyof IDubber)[] = [
      'members',
      'membersInvited',
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }

  static user(object: HydratedDocument<IUser> | IUser, exposed?: boolean): IUser {
    const keys: (keyof IUser)[] = [
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