import { HandleRequest } from '~/utils/http-utils';
import { NekoError } from '~/service/ExceptionService';



/**
 * Get anime episodes with pagination
 */
const endpoint = HandleRequest(async (req, res) => {
  throw new NekoError('sys:not_implemented');
});



export default [
  endpoint
];