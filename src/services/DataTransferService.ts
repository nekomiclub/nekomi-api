import IAnime, { AnimeCardType, AnimeMinifiedSchema, IAnimeMinified, IAnimePosterNode, IAnimeScreenshotNode } from '~/schemas/entities/Anime.schema';
import ITeam, { TeamCardType } from '~/schemas/entities/Team.schema';
import IUser, { IUserLib, IUserMinified, UserCardType, UserMinifiedSchema } from '~/schemas/entities/User.schema';
import conf from '~/conf';
import express from 'express';
import z, { ZodSchema } from 'zod';
import { AnimeDescribedGenres } from '~/data/AnimePrimitives';
import { HydratedDocument } from 'mongoose';
import { asCDNString } from '~/intf/BrandedIds';
import { isRequesterAccountOwner, isRequesterAdmin } from '~/utils/auth-utils';



/**
 * Exclude specified keys from provided object
 * 
 * @returns object copy without specified keys
 */
function excludeKeys<T>(object: object, exclude: string[]): T {
  const instance = { ...object } as T;

  // Exclude mongodb keys by default
  exclude.push('_id');
  exclude.push('__v');

  for (const key in object) {
    if (exclude.includes(key)) {
      instance[key] = undefined;
    }
  }

  return instance;
}



/** 
 * Pick specified keys from provided object
 * 
 * @returns object copy with specified keys
 */
function pickKeys<T>(object: object, include: string[]): T {
  const instance = {} as T;

  include.forEach(key => {
    instance[key] = object[key];
  });

  return instance;
}



class DTSClass {
  excludeKeys = excludeKeys;
  pickKeys = pickKeys;

  /** Parse mongodb HydratedDocument to plain object with excluded default __v keys */
  parse<T = any>(object: HydratedDocument<any> | any): T {
    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, []);
  }

  /** @deprecated idk */
  refine<S extends ZodSchema>(payload: any, schema: S): z.infer<S> {
    return schema.parse(payload);
  }



  anime(object: HydratedDocument<IAnime> | IAnime, exposed?: boolean): IAnime {
    const keys: (keyof IAnime)[] = [
      'posters',
      'relations',
      'screenshots',
      'player',
      'episodes_meta',
      'updated_at',
      'created_at',
      'about_synced_at',
      'episodes_synced_at',
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
      poster: asCDNString(posters.find(el => el.is_hero)?.small ?? posters[0]?.small ?? conf.vars.defaultPoster),
      title: title_ua ?? title_en ?? 'Untitled',
      genres: genres.map(el => AnimeDescribedGenres[el]),
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



  toAnimeMinified(payload: IAnime): IAnimeMinified {
    return AnimeMinifiedSchema.parse({
      ...payload,
      poster: asCDNString(payload.posters.find(el => el.is_hero)?.small ?? payload.posters[0]?.small ?? conf.vars.defaultPoster),
      title: payload.title_ua ?? payload.title_en ?? 'Untitled',
      genres: payload.genres.map(el => AnimeDescribedGenres[el]),
    } satisfies IAnimeMinified);
  }



  team(object: HydratedDocument<ITeam> | ITeam, exposed?: boolean): ITeam {
    const keys: (keyof ITeam)[] = [
      'members'
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }



  toTeamCard({ id, avatar, name, slug }: ITeam): TeamCardType {
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

  toUserMinified(payload: IUser): IUserMinified {
    return UserMinifiedSchema.parse(payload);
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



const DTS = new DTSClass();

export default DTS;