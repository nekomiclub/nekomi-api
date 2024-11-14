import { WebSocket } from 'ws';

import { TMiddlewareName } from '../services/MiddlewareService';
import { TRoleCapability } from './Roles';

declare global {
  namespace Express {
    interface Request {
      /** Nekomi internal data */
      nekomi: {
        /** Request user
         * @requires FkUsapiAuthRefresh middleware
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
  nekomi: {
    TBD?: void
  };
}