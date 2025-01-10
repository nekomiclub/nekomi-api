import { WebSocket } from 'ws';

import { IUserTogetherRoom } from './User';
import { TMiddlewareName } from '../services/MiddlewareService';
import { TRoleCapability } from './Roles';
import { TWS_Group } from './WebSocket';

declare global {
  namespace Express {
    interface Request {
      /** Nekomi internal data */
      nekomi: {
        /** Request user
         * @requires CheckAccess middleware
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
    user?: {
      id: string
    }

    /** Watch together room */
    wt?: {
      roomId: string
      ownerId: string
      settings: IUserTogetherRoom['settings']
    }
    /** Event listener */
    listener: TWS_Group[]
  };
}