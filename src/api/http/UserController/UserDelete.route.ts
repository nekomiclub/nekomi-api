import { HandleRequest } from '~/utils/http-utils';
import { NekoError } from '~/service/ExceptionService';



/**
 * Delete user document
 */
const endpoint = HandleRequest(async (req, res) => {
  throw new NekoError('sys:not_implemented');
});



const UserDeleteRoute = [
  endpoint
];

export default UserDeleteRoute;