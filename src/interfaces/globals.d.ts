import { TRoleCapability } from './Roles';

declare global {
  namespace Express {
    interface Request {
      /** Animee internal data */
      animee: {
        /** User id
         * @requires AccessControll middleware
         */
        userID?: string

        /** User capabilities
         * @requires AccessControll middleware
         */
        userCapabilities?: TRoleCapability[]
      }
    }
  }
}