import conf from '~/config';
import { HandleRequest } from '~/utils/http-utils';



/**
 * Ping API
 */
const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json({
    message: 'pong!',
    startedAt: conf.startedAt
  });
});



const GenericGetPingRoute = [
  endpoint
];

export default GenericGetPingRoute;