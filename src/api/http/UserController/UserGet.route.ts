import DTS from '~/service/DataTransferService';
import MiddlewareService from '~/service/MiddlewareService';
import conf from '~/conf';
import z from 'zod';
import { ArgumentTypes, zBoolean } from '~/intf/types';
import { CreateResponseSchema, EndpointMiddlewares, HandleRequest, SendResponse, getSessionToken } from '~/utils/http-utils';
import { ROLE_PERMISSION } from '~/schemas/entities/Role.schema';
import { USER_RESTRICTION, UserLibSchema, UserMinifiedSchema, UserSchema, UserViewProgressSchema } from '~/schemas/entities/User.schema';
import { UserRepositoryClass } from '~/repo/UserRepository';
import { isEligible, isRequesterAccountOwner, isRequesterAdmin, isRequesterCSRF } from '~/utils/auth-utils';
import { parseRolesPermissions } from '~/repo/RoleRepository';
import { registry } from '~/service/openapi/registry';



const UserPublicSchema = UserSchema.pick({
  id: true,
  username: true,
  avatar: true,
  cover: true,
  total_viewtime: true,
  dubber_team_member: true,
  roles: true,
  username_changed_at: true,
  created_at: true,
  updated_at: true,
});

const UserDataSchema = z.object({
  user: UserPublicSchema.or(UserMinifiedSchema),

  /** @see RequestQuerySchema#get_permissions */
  user_permissions: z.nativeEnum(ROLE_PERMISSION).array().optional(),

  /** @see RequestQuerySchema#get_permissions */
  user_restrictions: z.nativeEnum(USER_RESTRICTION).array().optional(),

  /** @see RequestQuerySchema#is_extended */
  user_libs: UserLibSchema.array().optional(),

  /** @see RequestQuerySchema#get_view_progress */
  user_view_progress: UserViewProgressSchema.array().optional(),

  /** @see RequestQuerySchema#get_email */
  user_email: z.string().optional(),
});



const RequestParamsSchema = z.object({
  query: z.string().nonempty().optional().describe('(username, id, etc)'),
});

const RequestQuerySchema = z.object({
  get_permissions: zBoolean.optional().describe('Get user permissions & restrictions'),
  is_extended: zBoolean.optional().describe('Get extended user object. @requires Authorization (CSRF)'),
  get_view_progress: zBoolean.optional().describe('Get user view_progress object. @requires Authorization (CSRF)'),
  get_email: zBoolean.optional().describe('Get user email. @requires Authorization (CSRF+Authorization) Owner/Moderator'),
});

const ResponseSchema = CreateResponseSchema(UserDataSchema);



registry.registerPath({
  method: 'get',
  path: '/user',
  summary: 'Get the authenticated user',
  tags: ['User Router'],
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
  path: '/user/{query}',
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
  const { query } = RequestParamsSchema.parse(req.params);
  const { get_permissions, get_view_progress, get_email, is_extended } = RequestQuerySchema.parse(req.query);

  const repo = new UserRepositoryClass();

  let isUserOwner = false;
  let isUserAdmin = false;
  let isCSRFValid = false;

  const isAdmin = async (...args: ArgumentTypes<typeof isRequesterAdmin>) => { return isUserAdmin = await isRequesterAdmin(...args); };
  const isOwner = async (...args: ArgumentTypes<typeof isRequesterAccountOwner>) => { return isUserOwner = await isRequesterAccountOwner(...args); };
  const isCSRF = async (...args: ArgumentTypes<typeof isRequesterCSRF>) => { return isCSRFValid = await isRequesterCSRF(...args); };



  // Initialize repository
  if (!query) {
    // Get query from session
    const { user } = await new MiddlewareService().checkAccess(getSessionToken(req));

    await repo.init({ id: user.id });
  } else await repo.init(query);



  let user: z.infer<typeof UserDataSchema.shape.user>;
  let user_permissions: z.infer<typeof UserDataSchema.shape.user_permissions> | undefined;
  let user_restrictions: z.infer<typeof UserDataSchema.shape.user_restrictions> | undefined;
  let user_libs: z.infer<typeof UserDataSchema.shape.user_libs> | undefined;
  let user_view_progress: z.infer<typeof UserDataSchema.shape.user_view_progress> | undefined;
  let user_email: z.infer<typeof UserDataSchema.shape.user_email> | undefined;



  if (is_extended && isEligible(`is_extended`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
    const userRefined = UserPublicSchema.parse(repo.document);

    user = userRefined;
  } else user = DTS.toUserMinified(repo.document);

  // Handle get_permissions
  if (get_permissions) {
    if (isEligible(`get_restrictions`, (await isAdmin(req, isUserAdmin) || await isOwner(req, repo.document.id, isUserOwner)) && await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
      user_permissions = await parseRolesPermissions(repo.document.roles);
      user_restrictions = repo.document.restrictions;
    }
  }

  // Handle is_extended
  if (is_extended && isEligible(`get_libs`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
    user_libs = await DTS.parseUserLibs(req, repo.document);
  }

  // Handle get_email
  if (get_email && isEligible(`get_email`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
    user_email = repo.document.email;
  }

  // Handle get_view_progress
  if (get_view_progress && isEligible(`get_view_progress`, await isCSRF(req, [conf.domains.NEKOMI_DOMAIN], isCSRFValid))) {
    user_view_progress = repo.document.view_progress;
  }



  return res.status(200).json(SendResponse({
    ok: true,
    message: 'User retrieved',
    data: {
      user,
      user_permissions,
      user_restrictions,
      user_libs,
      user_view_progress,
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