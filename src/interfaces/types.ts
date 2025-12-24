import { JwtPayload } from 'jsonwebtoken';
import { z } from 'zod';



/** ISO Date string */
export type ISODateString = string;

/** Nekomi CDN string */
export type CDNString = string;

export type RepositoryQueriesType<M> = { $or: Partial<Record<keyof M, string>>[] }

export interface ICSRFToken {
  origin: string
}

export interface IJWTokenPayload<T = object> {
  payload: JwtPayload & T;

  /** Will be null if verify method is not specified */
  verified: boolean | null;
}




/** Transform stringified false > boolean false */
export const ZodBooleanish = z.string().refine((value) => value === 'true' || value === 'false', {
  message: 'Value must be a boolean',
}).transform((value) => value === 'true');