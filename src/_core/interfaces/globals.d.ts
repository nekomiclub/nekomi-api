
import { TMiddlewareName } from '~/services/MiddlewareService';
import { TRoleCapability } from './IRoles';


export interface IEXPRESS_REQ_NEKOMI_USER {
  id: string
  username: string
  capabilities: TRoleCapability[]
}



declare global {
  namespace Express {
    interface Request {
      /** Nekomi internal data */
      nekomi: {
        /** Request user
         * @requires CheckAccess middleware
         */
        user?: IEXPRESS_REQ_NEKOMI_USER

        /** Request passed middlewares */
        middlewaresPassed?: TMiddlewareName[]
      }
    }
  }
}