import z from 'zod';



export const HomeFeedHeroSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  synopsys: z.string().nullish(),

  poster: z.string(),
  cover: z.string(),
  video: z.string().nullish(),
});



export type IHomeFeedHero = z.infer<typeof HomeFeedHeroSchema>