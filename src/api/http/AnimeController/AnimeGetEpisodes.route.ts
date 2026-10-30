import conf from '~/conf';
import z from 'zod';
import { AnimeGetEpisodes, AnimeGetEpisodesSchema, AnimeParamsSchema } from './anime-controller-utils';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';



export const GetAnimeEpisodesParamSchema = AnimeParamsSchema;

export const GetAnimeEpisodesResponseSchema = z.object({
  message: z.string(),
  anime_episodes: AnimeGetEpisodesSchema
});



/**
 * Get anime episodes with pagination
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = GetAnimeEpisodesParamSchema.parse(req.params);

  const repo = new AnimeRepositoryClass();
  await repo.init(query);

  const anime_episodes = await AnimeGetEpisodes(repo.document);



  return res.status(200).json({
    message: `Anime episodes retrieved`,
    anime_episodes
  } satisfies z.infer<typeof GetAnimeEpisodesResponseSchema>);
});



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];