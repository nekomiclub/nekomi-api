import DTS from '~/service/DataTransferService.js';
import MiddlewareService from '~/service/MiddlewareService.js';
import z from 'zod';
import { ArgumentTypes, zBoolean } from '~/intf/types.js';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse, getAuthorizationToken } from '~/utils/http-utils.js';
import { IUserPublic, USER_RESTRICTION_ENUM, UserLibSchema, UserPublicSchema, UserViewProgressSchema } from '~/schemas/entities/User.schema.js';
import { ROLE_PERMISSION_ENUM } from '~/schemas/entities/Role.schema.js';
import { UserRepositoryClass } from '~/repo/UserRepository.js';
import { isEligible, isRequesterAPIValid, isRequesterAccountOwner, isRequesterAdmin } from '~/utils/auth-utils.js';
import { parseRolesPermissions } from '~/repo/RoleRepository.js';
import { registry } from '~/service/openapi/registry.js';



const UserExtendedSchema = z.object({
  libs: UserLibSchema.array(),
  total_viewtime: z.number(),
  view_progress: UserViewProgressSchema.array(),
});

const UserPermissionsSchema = z.object({
  permissions: z.nativeEnum(ROLE_PERMISSION_ENUM).openapi('ROLE_PERMISSION_ENUM').array(),
  restrictions: z.nativeEnum(USER_RESTRICTION_ENUM).openapi('USER_RESTRICTION_ENUM').array()
});

const UserDataSchema = z.object({
  user: UserPublicSchema,

  /** @see query#is_extended */
  user_extended: UserExtendedSchema.optional(),

  /** @see query#get_permissions */
  user_permissions: UserPermissionsSchema.optional(),

  /** @see query#get_email */
  user_email: z.string().optional(),
});



const RequestParamsSchema = z.object({
  qr: z.string().nonempty().optional().describe('(username, id, etc)'),
});

const RequestQuerySchema = z.object({
  get_permissions: zBoolean.optional().describe('Get user permissions & restrictions'),
  is_extended: zBoolean.optional().describe('Get extended user object. @requires Authorization (API Key)'),
  get_email: zBoolean.optional().describe('Get user email. @requires Authorization (API Key+Authorization) Owner/Moderator'),
});

const ResponseSchema = CreateResponseSchema(UserDataSchema);



registry.registerPath({
  method: 'get',
  path: '/user',
  summary: 'Get the authenticated user',
  tags: ['User Router'],
  request: {
    query: RequestQuerySchema
  },
  responses: {
    200: {
      description: 'User info retrieved',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});

registry.registerPath({
  method: 'get',
  path: '/user/{qr}',
  summary: 'Get user by query',
  tags: ['User Router'],
  request: {
    params: RequestParamsSchema.required(),
    query: RequestQuerySchema
  },
  responses: {
    200: {
      description: 'User info retrieved',
      content: {
        'application/json': {
          schema: ResponseSchema
        }
      }
    }
  }
});



/**
 * Get user by query or by session
 * If query is not provided, will try to parse userId from session
 * 
 * @see RequestQuerySchema
 */
const endpoint = HandleRequest(async (req, res) => {
  const { qr: query } = RequestParamsSchema.parse(req.params);
  const { get_permissions, get_email, is_extended } = RequestQuerySchema.parse(req.query);

  const repo = new UserRepositoryClass();

  let isUserOwner = false;
  let isUserAdmin = false;
  let isAPIKeyValid = false;

  const checkIsAdmin = async (...args: ArgumentTypes<typeof isRequesterAdmin>) => { return isUserAdmin = await isRequesterAdmin(...args); };
  const checkIsOwner = async (...args: ArgumentTypes<typeof isRequesterAccountOwner>) => { return isUserOwner = await isRequesterAccountOwner(...args); };
  const checkIsAPIKey = async (...args: ArgumentTypes<typeof isRequesterAPIValid>) => { return isAPIKeyValid = await isRequesterAPIValid(...args); };



  // Initialize repository
  if (!query) {
    // Get query from session
    const { user } = await new MiddlewareService().checkAccess(getAuthorizationToken(req));

    await repo.init({ id: user.id });
  } else await repo.init(query);



  let user: IUserPublic | undefined;
  let user_extended: z.infer<typeof UserExtendedSchema> | undefined;
  let user_permissions: z.infer<typeof UserPermissionsSchema> | undefined;
  let user_email: string | undefined;



  const userRefined = UserPublicSchema.parse(repo.document);

  user = userRefined;

  // Handle get_permissions
  if (get_permissions) {
    if (isEligible(`get_permissions`, (await checkIsAdmin(req, isUserAdmin) || await checkIsOwner(req, repo.document.id, isUserOwner)) && await checkIsAPIKey(req, isAPIKeyValid))) {
      user_permissions = {
        permissions: await parseRolesPermissions(repo.document.roles),
        restrictions: repo.document.restrictions
      };
    }
  }

  // Handle is_extended
  if (is_extended && isEligible(`is_extended`, await checkIsAPIKey(req, isAPIKeyValid))) {
    user_extended = {
      libs: await DTS.parseUserLibs(req, repo.document),
      view_progress: repo.document.view_progress,
      total_viewtime: repo.document.total_viewtime
    };
  }

  // Handle get_email
  if (get_email && isEligible(`get_email`, await checkIsAPIKey(req, isAPIKeyValid))) {
    user_email = repo.document.email;
  }



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'User retrieved',
    data: {
      user,
      user_extended,
      user_permissions,
      user_email,
    }
  }, ResponseSchema));
});



export default EndpointMiddlewares([], endpoint);



export const UserGetRouteSchemas = {
  RequestParamsSchema,
  RequestQuerySchema,
  ResponseSchema,
};