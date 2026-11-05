import z from 'zod';

/* --------------------- */
/* Base Feed schema      */
/* --------------------- */

export const FeedSchema = z.object({
  anime_id: z.string(),
  cover_url: z.string().url(),
  video_url: z.string().url(),
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
/* Inferred types        */
/* --------------------- */

export type IFeed = z.infer<typeof FeedSchema>
export type IFeedHydrated = z.infer<typeof FeedHydratedSchema>