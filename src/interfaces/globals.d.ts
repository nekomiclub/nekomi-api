import { WebSocket } from 'ws';
import { TRoleCapability } from './Roles';
import { TMiddlewareName } from '../services/MiddlewareService';

declare global {
  namespace Express {
    interface Request {
      /** Animee internal data */
      animee: {
        /** Request user
         * @requires AccessControl middleware
         */
        user?: {
          id: string
          username: string
          capabilities: TRoleCapability[]
        }

        /** Request passed middlewares */
        middlewaresPassed?: TMiddlewareName[]
      }
    }
  }
}

declare class WebSocketExtended extends WebSocket {
  /** Socket internal data */
  animee: {
    TBD?: void
  };
}