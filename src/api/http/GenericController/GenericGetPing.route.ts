import conf from '~/config';
import { HTTPEndpoint } from '~/service/HTTPService';



/**
 * Ping API
 */
const endpoint = HTTPEndpoint(async (req, res) => {
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