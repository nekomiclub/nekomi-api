import DTS from '~/service/DataTransferService';
import ITeam, { TeamMinifiedSchema } from '~/schemas/entities/Team.schema';
import conf from '~/conf';
import z from 'zod';
import { HandleRequest } from '~/utils/http-utils';
import { Middleware } from '~/service/MiddlewareService';
import { PaginationSchema } from '~/utils/pagination';
import { RequestSearch, TeamSearch } from '~/service/SearchService';
import { TeamRepositoryClass } from '~/repo/TeamRepository';



export const TeamSearchResultSchema = TeamMinifiedSchema.extend({
  short_about: z.string().optional()
});



export const ResponseSchema = z.object({
  message: z.string(),
  results: TeamSearchResultSchema.array(),
  pagination: PaginationSchema.optional()
});



/**
 * Search dubbers
 */
const endpoint = HandleRequest(async (req, res) => {
  const { results: searches, pagination } = await RequestSearch<ITeam>(req, new TeamRepositoryClass(), TeamSearch);

  const results = searches.map(result => {
    return {
      ...DTS.toTeamMinified(result),
      short_about: result.about?.slice(0, 200)
    } satisfies z.infer<typeof TeamSearchResultSchema>;
  });



  return res.status(200).json({
    message: 'Dubbers searched',
    results,
    pagination
  } satisfies z.infer<typeof ResponseSchema>);
});



export default [
  Middleware.CheckCSRF([conf.domains.NEKOMI_DOMAIN]),
  endpoint
];