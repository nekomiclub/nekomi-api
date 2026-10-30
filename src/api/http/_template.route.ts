import { HandleRequest } from '~/utils/http-utils';



/**
 * Get document
 */
const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json({ message: 'ok' });
});



export default [
  endpoint
];