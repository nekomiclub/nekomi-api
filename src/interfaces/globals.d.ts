import { WebSocket } from 'ws';

import { TMiddlewareName } from '../services/MiddlewareService';
import { TRoleCapability } from './Roles';
import { TWS_Group } from './WebSocket';

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
    /** Watch together room id */
    togetherRoomID: string | null
    /** Group participant */
    participant: TWS_Group[]
  };
}