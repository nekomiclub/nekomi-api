import z from 'zod';

/* --------------------- */
/* Base schema           */
/* --------------------- */

export const FeedSchema = z.object({
  anime_id: z.string(),
  cover_url: z.url(),
  video_url: z.url(),
});

/* --------------------- */
/* DTS                   */
/* --------------------- */

export const FeedHydratedSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  synopsys: z.string().nullish(),

  poster: z.string(),
  cover: z.string(),
  video: z.string().nullish(),
}).openapi('FeedHydrated');

/* --------------------- */
/* Repository schemas    */
/* --------------------- */

export const CreateFeedSchema = FeedSchema.pick({
  anime_id: true,
  cover_url: true,
  video_url: true,
});

/* --------------------- */
/* Inferred types        */
/* --------------------- */

export type FeedEntity = z.infer<typeof FeedSchema>

export type FeedEntityHydrated = z.infer<typeof FeedHydratedSchema>

export type ICreateFeedEntitySchema = z.infer<typeof CreateFeedSchema>