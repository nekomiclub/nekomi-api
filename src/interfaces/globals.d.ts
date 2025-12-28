import { MiddlewareType } from '~/service/MiddlewareService';



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
      }
    }
  }
}