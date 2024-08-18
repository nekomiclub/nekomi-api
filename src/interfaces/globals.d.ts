import { TRoleCapability } from './Roles';

declare global {
  namespace Express {
    interface Request {
      /** Animee internal data */
      animee: {
        /** User id
         * @requires AccessControl middleware
         */
        userID?: string

        /** User capabilities
         * @requires AccessControl middleware
         */
        userCapabilities?: TRoleCapability[],
      }
    }
  }
}