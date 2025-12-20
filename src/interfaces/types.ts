import { z } from 'zod';



/** ISO Date string */
export type ISODateString = string;

/** Nekomi CDN string */
export type CDNString = string;

export type RepositoryQueriesType<M> = { $or: Partial<Record<keyof M, string>>[] }



export const ZodBooleanish = z.string().refine((value) => value === 'true' || value === 'false', {
  message: 'Value must be a boolean',
}).transform((value) => value === 'true');