import conf from '~/config';
import { HTTPEndpoint } from '~/service/HTTPService';



const endpoint = HTTPEndpoint(async (req, res) => {
  return res.status(200).json({
    message: 'pong!',
    commit: conf.commit,
    startedAt: conf.startedAt
  });
});



const GenericGetPing = [
  endpoint
];

export default GenericGetPing;