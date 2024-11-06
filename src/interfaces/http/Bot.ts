import { config } from '../../config';

const baseURL = config.URL.nekomi_bot;

/** Base URL (http://example.com) included */
export const NEKOMI_BOT = {
  /** @method POST @interface INotifyBroadcast */
  broadcast: `${baseURL}/broadcast`
};