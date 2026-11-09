import IAnime, { AnimeExtendedSchema, AnimeMinifiedSchema, AnimeSearchResultSchema, IAnimeExtended, IAnimeMinified, IAnimePosterNode, IAnimeScreenshotNode, IAnimeSearchResult } from '~/domain/anime.schema.js';
import ITeam, { ITeamMinified, ITeamSearchResult, TeamMinifiedSchema, TeamSearchResultSchema } from '~/domain/team.schema.js';
import IUser, { IUserLib, IUserMinified, IUserSearchResult, UserMinifiedSchema, UserSearchResultSchema } from '~/domain/user.schema.js';
import conf from '~/conf.js';
import express from 'express';
import z, { ZodSchema } from 'zod';
import { AnimeDescribedGenres, AnimeDescribedRatings, AnimeNamedRecordSchema } from '~/data/AnimePrimitives.js';
import { HydratedDocument } from 'mongoose';
import { asCDNString } from '~/interfaces/BrandedIds.js';
import { isRequesterAccountOwner, isRequesterAdmin } from '~/utils/auth-utils.js';



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



  toAnimeMinified(payload: IAnime): IAnimeMinified {
    return AnimeMinifiedSchema.parse({
      ...payload,
      title: payload.title_ua ?? payload.title_en ?? payload.title_ja ?? 'Аніме без назви',
      poster: asCDNString(payload.posters.find(el => el.is_hero)?.small ?? payload.posters[0]?.small ?? conf.variables.default_anime_poster_url),
      genres: payload.genres.map(el => AnimeDescribedGenres[el])
    } satisfies IAnimeMinified);
  }



  toAnimeExtended(payload: IAnime): IAnimeExtended {
    return AnimeExtendedSchema.parse({
      ...this.toAnimeMinified(payload),
      year: payload.year,
      short_synopsys: (payload.synopsis_ua ?? payload.synopsis_en)?.slice(0, 300),
      subtitle: payload.title_en ?? payload.title_ja,
      type: payload.type ? AnimeNamedRecordSchema[payload.type] : undefined,
      season: payload.season ? AnimeNamedRecordSchema[payload.season] : undefined,
      status: payload.status ? AnimeNamedRecordSchema[payload.status] : undefined,
      rating: payload.rating ? AnimeDescribedRatings[payload.rating] : undefined,
      genres: payload.genres.map(el => AnimeDescribedGenres[el]),
    } satisfies IAnimeExtended);
  }



  toAnimeSearchResult(payload: IAnime): IAnimeSearchResult {
    return AnimeSearchResultSchema.parse({
      ...payload,
      poster: asCDNString(payload.posters.find(el => el.is_hero)?.small ?? payload.posters[0]?.small ?? conf.variables.default_anime_poster_url),
      type: payload.type ? AnimeNamedRecordSchema[payload.type] : undefined,
    } satisfies IAnimeSearchResult);
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



  team(object: HydratedDocument<ITeam> | ITeam, exposed?: boolean): ITeam {
    const keys: (keyof ITeam)[] = [
      'members'
    ];

    // Convert HydratedDocument into plain object
    if ('toObject' in object) object = object.toObject();

    return excludeKeys(object, exposed ? [] : keys);
  }



  toTeamMinified(payload: ITeam): ITeamMinified {
    return TeamMinifiedSchema.parse(payload);
  }



  toTeamSearchResult(payload: ITeam): ITeamSearchResult {
    return TeamSearchResultSchema.parse({
      ...DTS.toTeamMinified(payload),
      short_about: payload.about?.slice(0, 200)
    } satisfies ITeamSearchResult);
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



  toUserMinified(payload: IUser): IUserMinified {
    return UserMinifiedSchema.parse(payload);
  }



  toUserSearchResult(payload: IUser): IUserSearchResult {
    return UserSearchResultSchema.parse(payload);
  }



  /** @deprecated rework somehow */
  async parseUserLibs(req: express.Request, user: IUser): Promise<IUserLib[]> {
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