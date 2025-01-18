import { $upload } from '~/Services/HTTPService';
import { AxiosError } from 'axios';
import { Logger } from '~/Services/LoggerService';
import { TEpisodeQuality, TUploadType } from '~/core/Interfaces/API/INekomiUploadsAPI';
import { config } from '~/config';

interface IUploadFileProps {
  file: Express.Multer.File
  uploadedById: string
  type: TUploadType
  qualities?: TEpisodeQuality[]
}

interface IDeleteUploadProps {
  id: string
  deletedById: string
  withChildren?: boolean
}



const baseURL = config.URL.nekomi_uploads;

/** @version 1.3.2 */
export class NekomiUploadsAPI {
  static getUploadIdFromURL(url: string): string {
    return new URL(url).pathname.replace('/', '');
  }

  static async uploadFile({ file, uploadedById, type, qualities }: IUploadFileProps) {
    const { buffer, originalname, mimetype } = file;

    const formData = new FormData();

    formData.append('file', new Blob([buffer], {
      type: mimetype
    }), originalname);
    formData.set('uploadedBy', uploadedById);
    formData.set('type', type);

    if (qualities?.length) formData.set('qualities', JSON.stringify(qualities));

    const { data } = await $upload.post<{
      id: string
      url: string
      srt_id?: string

      /** @type video/title/episode - total frames count */
      frames?: number
    }>(`${baseURL}/upload`, formData);

    Logger.debug(`[NekomiUploads]: Upload created. [id: ${data.id}; by: ${uploadedById}]`);

    return data;
  }

  static async deleteUpload({ id, deletedById, withChildren }: IDeleteUploadProps) {
    try {
      await $upload.delete(`${baseURL}/upload/${id}`, {
        params: {
          by: deletedById,
          withChildren
        }
      });

      Logger.debug(`[NekomiUploads]: Upload deleted. [id: ${id}; by: ${deletedById}]`);
    } catch (e) {
      // Pass 404 error
      if (e instanceof AxiosError && e.status === 404) return;

      throw e;
    }
  }
}



export default NekomiUploadsAPI;