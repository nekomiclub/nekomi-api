import { config } from '../../config';

const baseURL = config.URL.uploads;

/** Episode processing qualities */
export const EpisodeQualities = [240, 480, 720, 1080, 2160] as const;

/** Type implementation of EpisodeQualities */
export type TEpisodeQuality = typeof EpisodeQualities[number];

/** Base URL (http://example.com) included */
export const ANIMEE_UPLOADS = {
  /** @method DELETE @param id */
  delete_upload: (id: string) => `${baseURL}/upload/${id}`,

  /** @method POST @returns IA_UploadsUpload */
  upload: `${baseURL}/upload`,
};

/** @prop ANIMEE_UPLOADS.upload */
export interface IA_UploadsUpload {
  /** Upload ID */
  id: string

  /** Upload URL */
  url: string
}