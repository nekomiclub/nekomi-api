import z from 'zod';

import { TeamEntityMemberExtended, TeamEntityPublic, TeamMemberExtendedSchema, TeamPublicSchema, TeamSchema } from '~/domain/team.schema.js';
import { ArgumentTypes, zBoolean } from '~/interfaces/types.js';
import { TeamRepositoryClass } from '~/repositories/TeamRepository.js';
import UserRepository from '~/repositories/UserRepository.js';
import DTS from '~/services/DataTransferService.js';
import { registry } from '~/services/openapi/registry.js';
import { isEligible, isRequesterAPIValid } from '~/utils/auth-utils.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse } from '~/utils/http-utils.js';



const RequestParamsSchema = z.object({
  qr: z.string().nonempty().describe('(slug, id, etc)')
});

const RequestQuerySchema = z.object({
  is_extended: zBoolean.optional().describe('Get extended team object. @requires Authorization (API Key)')
});

const ResponseSchema = CreateResponseSchema(z.object({
  team: TeamPublicSchema,

  /** @see query#is_extended */
  team_members: TeamMemberExtendedSchema.array().optional()
}));



registry.registerPath({
  method: 'get',
  path: '/team/{qr}',
  summary: 'Get team by query',
  tags: ['Team Router'],
  request: {
    params: RequestParamsSchema,
    query: RequestQuerySchema
  },
  responses: {
    200: {
      description: 'Team retrieved',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Get team document
 */
const endpoint = HandleRequest(async (req, res) => {
  const { qr: query } = RequestParamsSchema.parse(req.params);
  const { is_extended } = RequestQuerySchema.parse(req.query);

  const repo = new TeamRepositoryClass();
  await repo.init(query);

  let isAPIKeyValid = false;

  const checkAPIKey = async (...args: ArgumentTypes<typeof isRequesterAPIValid>) => { return isAPIKeyValid = await isRequesterAPIValid(...args); };

  let team: TeamEntityPublic | undefined = undefined;
  let team_members: TeamEntityMemberExtended[] | undefined = undefined;

  const refinedTeam = TeamSchema.parse(repo.document);

  team = refinedTeam;



  if (is_extended && isEligible(`is_extended`, await checkAPIKey(req, isAPIKeyValid))) {
    const users = await UserRepository.getMany({ id: { $in: repo.document.members.map(el => el.id) } });

    team_members = users.map(user => {
      const refinedUser = DTS.toUserMinified(user);
      const { member_since, role } = repo.document.members.find(el => el.id === user.id)!;

      const memberExtendede = TeamMemberExtendedSchema.parse({
        ...refinedUser,
        role,
        member_since,
      });

      return memberExtendede;
    });
  }



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'Team retrieved',
    data: {
      team,
      team_members
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([], endpoint);



export const TeamGetRouteSchemas = {
  RequestParamsSchema,
  RequestQuerySchema,
  ResponseSchema,
};