import z from 'zod';
import { AnimeId } from './BrandedIds';
import { Filter } from 'mongodb';
import { JwtPayload } from 'jsonwebtoken';



/** 
 * ISO Date string
 * 
 * @deprecated rework into branded type
 */
export type ISODateString = string;



/** 
 * Nekomi CDN string
 * 
 * @deprecated rework into branded type
 */
export type CDNString = string;

export type RepositoryGetQueryType<M> = string | Filter<M>
export type RepositoryQueriesType<M> = { $or: Partial<Record<keyof M, string>>[] }



/** Type for object key nesting */
export type NestedKey<T> = {
  [K in keyof T]:
  T[K] extends object
  ? K | `${K & string}.${keyof T[K] & string}`
  : K
}[keyof T];



/** Get value type from nested object path */
export type ValueFromPath<T, P> =
  P extends `${infer K}.${infer R}`
  ? K extends keyof T
  ? R extends keyof T[K]
  ? T[K][R]
  : never
  : never
  : P extends keyof T
  ? T[P]
  : never;


/**
 * JWT payload object
 */
export interface IJWTokenPayload<T = object> {
  payload: JwtPayload & T;

  /** Will be null if verify method is not specified */
  verified: boolean | null;
}



/** 
 * Copy generic function arguments to type
 * 
 * @example ArgumentTypes<typeof Function>
 */
// eslint-disable-next-line
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;



export interface IHomeFeedHero {
  id: AnimeId
  slug: string
  title: string
  synopsys: string | null

  poster: CDNString
  cover: CDNString
  video: CDNString | null
}



/**
 * Zod parse booleanish values ("false" > false, instead of non-empty string true)
 */
export const zBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());