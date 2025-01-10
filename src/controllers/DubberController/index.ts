import DubberController from './controller';
import { HTTPEndpoint } from '~/services/HTTPService';



//* ===================================== PATCH SETTINGS
const PatchSettings = HTTPEndpoint(async (req, res) => {
  const { status, message, dubber } = await DubberController.PatchSettings(req.body);

  return res.status(status).json({ message, dubber });
});



export default class DubberRoutes {
  static PatchSettings = PatchSettings;
}