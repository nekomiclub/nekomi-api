import DTS from '~/service/DataTransferService';
import IAnime, { AnimeExtendedSchema, IAnimeExtended } from '~/schemas/entities/Anime.schema';
import conf from '~/conf';
import z from 'zod';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { AnimeSearch, RequestSearch, SearchServiceQueryParamsSchema } from '~/service/SearchService';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { PaginationSchema } from '~/utils/pagination';



export const GetAnimeSearchQuerySchema = SearchServiceQueryParamsSchema;

export const GetAnimeSearchResponseSchema = z.object({
  message: z.string(),
  results: AnimeExtendedSchema.array(),
  pagination: PaginationSchema.optional()
});



/**
 * Search anime documents
 */
const endpoint = HandleRequest(async (req, res) => {
  const repo = new AnimeRepositoryClass();
  const { results: raw, pagination } = await RequestSearch<IAnime>(req, repo, AnimeSearch);

  const results: IAnimeExtended[] = raw.map(result => DTS.toAnimeExtended(result));



  return res.status(200).json({
    message: 'Animes searched',
    results,
    pagination
  } satisfies z.infer<typeof GetAnimeSearchResponseSchema>);
});



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];