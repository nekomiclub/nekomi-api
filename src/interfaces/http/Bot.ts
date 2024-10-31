import { config } from '../../config';

const baseURL = config.URL.uploadsBot;

/** Base URL (http://example.com) included */
export const ANIMEE_UPLOADS_BOT = {
  /** @method POST @interface INotifyBroadcast */
  broadcast: `${baseURL}/broadcast`
};