import { WebSocket } from 'ws';

import { IUserTogetherRoom } from './IUser';
import { TMiddlewareName } from '../../services/MiddlewareService';
import { TRoleCapability } from './IRoles';
import { TWS_Group } from './IWebSocket';


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