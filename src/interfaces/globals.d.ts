import { MiddlewareType } from '~/service/MiddlewareService';
import { ROLE_PERMISSION } from '~/schemas/entities/Role.schema';
import { UserId } from './BrandedIds';



declare global {
  namespace Express {
    interface Request {
      /** Nekomi internal data */
      _nekomi: {
        /** Request passed middlewares */
        middlewaresPassed: MiddlewareType[]



        /** 
         * CSRF origin
         * 
         * @requires Middleware.CheckCSRF()
         */
        csrfOrigin?: string



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
          permissions: ROLE_PERMISSION[] | null
        }
      }
    }
  }
}