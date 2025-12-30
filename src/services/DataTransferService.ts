import IAnime, { AnimeCardType, IAnimePosterNode, IAnimeScreenshotNode } from '~/intf/IAnime';
import IDubber from '~/intf/IDubber';
import IUser from '~/intf/IUser';
import { ANIME_GENRES } from '~/repo/old/AnimeModel';
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



class DTOServiceClass {
  parse<T = any>(object: HydratedDocument<any> | any): T {
    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, []);
  }



  anime(object: HydratedDocument<IAnime> | IAnime, exposed?: boolean): IAnime {
    const keys: (keyof IAnime)[] = [
      'posters',
      'relations',
      'screenshots',
      'episodes',
      'episodes_meta',
      'updated_at',
      'created_at',
      'hikka_sync',
      'myanimelist_sync',
      'is_DMCA_restricted',
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }



  dubber(object: HydratedDocument<IDubber> | IDubber, exposed?: boolean): IDubber {
    const keys: (keyof IDubber)[] = [
      'members'
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }



  user(object: HydratedDocument<IUser> | IUser, exposed?: boolean): IUser {
    const keys: (keyof IUser)[] = [
      'roles',
      'libs',
      'view_progress',
      'telegram_id',
      'created_at',
      'updated_at',
      'email',
      'restrictions',
      'sessions',
      'subscriptions',
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }



  toAnimeCard(document: IAnime): AnimeCardType {
    return {
      id: document.id,
      slug: document.slug,
      episodes_total: document.episodes_total,
      score: document.score,
      title: document.title_ua ?? document.title_en,
      genres: document.genres.map(el => ANIME_GENRES[el]),
    };
  }



  animePoster(object: IAnimePosterNode): IAnimePosterNode {
    const keys: (keyof IAnimePosterNode)[] = [
      '_unprocessedAuthorName',
      'pull_hash'
    ];

    return excludeKeys(object, keys);
  }



  animeScreenshot(object: IAnimeScreenshotNode): IAnimeScreenshotNode {
    const keys: (keyof IAnimeScreenshotNode)[] = [
      'pull_hash'
    ];

    return excludeKeys(object, keys);
  }
}



const DTOService = new DTOServiceClass();

export default DTOService;