import DTOService from '~/service/DataTransferService';
import ITeam, { TeamMinifiedSchema } from '~/intf/ITeam';
import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { PaginationSchema } from '~/utils/pagination';
import { RequestSearch, TeamSearch } from '~/service/SearchService';
import { TeamRepositoryClass } from '~/repo/TeamRepository';



export const TeamGetSearchResponseSchema = z.object({
  message: z.string(),
  results: z.array(z.object({})),
  pagination: PaginationSchema.optional()
});



/**
 * Search dubbers
 */
const endpoint = HandleRequest(async (req, res) => {
  const { results: searches, pagination } = await RequestSearch<ITeam>(req, new TeamRepositoryClass(), TeamSearch);

  const results = searches.map(result => DTOService.refine(result, TeamMinifiedSchema));



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