import { WebSocket } from 'ws';
import { TRoleCapability } from './Roles';

declare global {
  namespace Express {
    interface Request {
      /** Animee internal data */
      animee: {
        /** User id
         * @requires AccessControl middleware
         * @deprecated use user.id instead
         */
        userID?: string

        /** User capabilities
         * @requires AccessControl middleware
         * @deprecated use user.capabilities instead
         */
        userCapabilities?: TRoleCapability[],

        /** Request user
         * @requires AccessControl middleware
         */
        user?: {
          id: string
          username: string
          capabilities: TRoleCapability[]
        }

        /** Request origin verified by CSRF
         * @requires CheckCSRF middleware
         */
        CSRF_origin?: string
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