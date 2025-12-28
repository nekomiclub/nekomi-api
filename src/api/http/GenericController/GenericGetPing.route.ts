import conf from '~/config';
import { HandleRequest } from '~/utils/http-utils';



/**
 * Ping API
 */
const endpoint = HandleRequest(async (req, res) => {
  return res.status(200).json({
    message: 'pong!',
    commit: conf.commit,
    startedAt: conf.startedAt
  });
});



const GenericGetPingRoute = [
  endpoint
];

export default GenericGetPingRoute;