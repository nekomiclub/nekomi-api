import IAnime, { ANIME_GENRE, AnimeCardType, IAnimePosterNode, IAnimeScreenshotNode } from '~/intf/IAnime';
import IDubber, { DubberCardType } from '~/intf/IDubber';
import IUser, { IUserLib, UserCardType } from '~/intf/IUser';
import conf from '~/conf';
import express from 'express';
import { HydratedDocument } from 'mongoose';
import { isRequesterAccountOwner, isRequesterAdmin } from '~/utils/auth-utils';



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



function includeKeys<T>(object: object, include: string[]): T {
  const instance = {} as T;

  include.forEach(key => {
    instance[key] = object[key];
  });

  return instance;
}



class DTOServiceClass {
  excludeKeys = excludeKeys;
  includeKeys = includeKeys;

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
      'ashdi_url',
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }



  toAnimeCard({ id, slug, episodes_total, title_en, title_ua, genres, score, posters }: IAnime): AnimeCardType {
    return {
      id,
      slug,
      episodes_total,
      score,
      poster: posters.find(el => el.is_hero)?.small ?? posters[0]?.small ?? conf.vars.defaultPoster,
      title: title_ua ?? title_en ?? 'Untitled',
      genres: genres.map(el => ANIME_GENRE[el]),
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



  dubber(object: HydratedDocument<IDubber> | IDubber, exposed?: boolean): IDubber {
    const keys: (keyof IDubber)[] = [
      'members'
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }



  toDubberCard({ id, avatar, name, slug }: IDubber): DubberCardType {
    return { avatar, id, name, slug };
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



  toUserCard({ avatar, id, username, cover }: IUser): UserCardType {
    return { avatar, id, username, cover };
  }



  async userLibs(req: express.Request, user: IUser): Promise<IUserLib[]> {
    let showPrivate = false;

    try {
      showPrivate = await isRequesterAdmin(req) || await isRequesterAccountOwner(req, user.id);
    } catch (e) { null; }

    return user.libs.filter(el => {
      if (el.is_public) return el;
      if (!el.is_public && showPrivate) return el;

      return undefined;
    });
  }
}



const DTOService = new DTOServiceClass();

export default DTOService;