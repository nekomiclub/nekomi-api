import ITeam, { TeamMinifiedSchema } from '~/schemas/entities/Team.schema';
import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { PaginationSchema } from '~/utils/pagination';
import { RequestSearch, TeamSearch } from '~/service/SearchService';
import { TeamRepositoryClass } from '~/repo/TeamRepository';



export const TeamGetSearchResponseSchema = z.object({
  message: z.string(),
  results: TeamMinifiedSchema.array(),
  pagination: PaginationSchema.optional()
});



/**
 * Search dubbers
 */
const endpoint = HandleRequest(async (req, res) => {
  const { results: searches, pagination } = await RequestSearch<ITeam>(req, new TeamRepositoryClass(), TeamSearch);

  const results = searches.map(result => TeamMinifiedSchema.parse(result));



  return res.status(200).json({
    message: 'Dubbers searched',
    results,
    pagination
  } satisfies z.infer<typeof TeamGetSearchResponseSchema>);
});



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];