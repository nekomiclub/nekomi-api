import GenericController from './GenericController';
import { HTTPEndpoint } from '~/services/HTTPService';
import { config } from '~/config';



//* ===================================== GET PING
const getPing = HTTPEndpoint(async (req, res) => {
  await GenericController.GetPing();

  return res.status(200).json({
    message: 'pong!',
    commit: config.commit,
    startedAt: config.startedAt
  });
});

/** @tested 2.1.0 */
const GetPing = [
  getPing
];



//* ===================================== POST UPLOAD




//* ===================================== DELETE UPLOAD ID





export default class GenericRoutes {
  static GetPing = GetPing;
}