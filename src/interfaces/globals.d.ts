import { MiddlewareType } from '~/service/MiddlewareService';
import { ROLE_PERMISSION_ENUM } from '~/schemas/entities/Role.schema';
import { UserId } from './BrandedIds';



declare global {
  namespace Express {
    interface Request {
      /** Nekomi internal data */
      _nekomi: {
        /** Request passed middlewares */
        middlewaresPassed: MiddlewareType[]



        /**
         * Revalidated session token
         * 
         * @requires Middleware.CheckAccess()
         */
        sessionToken?: string



        /**
         * Requester user data
         * 
         * @requires Middleware.CheckAccess()
         */
        user?: {
          id: UserId
          sessionId: string
          permissions: ROLE_PERMISSION_ENUM[] | null
        }
      }
    }
  }
}