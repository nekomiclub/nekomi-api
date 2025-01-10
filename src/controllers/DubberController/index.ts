import DubberController, { IDubberPatchSettingsProps } from './controller';
import { HTTPEndpoint } from '~/services/HTTPService';
import { body } from 'express-validator';



//* ===================================== PATCH SETTINGS
const patchSettings = HTTPEndpoint(async (req, res) => {
  const { status, message, dubber } = await DubberController.patchSettings(req.body);

  return res.status(status).json({ message, dubber });
});

const PatchSettings = [
  body(['id'] as (keyof IDubberPatchSettingsProps)[]).notEmpty(),
  patchSettings,
];




export default class HTTPDubberRoutes {
  static PatchSettings = PatchSettings;
} 