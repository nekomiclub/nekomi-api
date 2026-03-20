import AnimeUpdateCrawler from '~/algorithms/AnimeUpdateCrawler';
import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { ROLE_PERMISSION } from '~/schemas/entities/Role.schema';

import AnimePlayerUpdateCrawler from '~/algorithms/AnimePlayerUpdateCrawler';
import { AnimeParamsSchema } from './anime-controller-utils';
import { asAnimeId } from '~/intf/BrandedIds';



export const GetAnimeParseParamSchema = AnimeParamsSchema;

export const GetAnimeParseResponseSchema = z.object({
  message: z.string()
});



/**
 * Get anime force parse 
 */
const endpoint = HandleRequest(async (req, res) => {
  const { query } = GetAnimeParseParamSchema.parse(req.params);

  await AnimeUpdateCrawler.syncAnimeDocument(asAnimeId(query));

  await AnimePlayerUpdateCrawler.updateTeamsMap();
  await AnimePlayerUpdateCrawler.syncAnimePlayer(asAnimeId(query));



  return res.status(200).json({
    message: 'Anime successfully re-parsed'
  } satisfies z.infer<typeof GetAnimeParseResponseSchema>);
});



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  Middleware.CheckAccess([ROLE_PERMISSION.ABSOLUTE]),
  endpoint
];