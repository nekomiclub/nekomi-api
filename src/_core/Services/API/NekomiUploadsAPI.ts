import { $upload } from '~/services/HTTPService';
import { AxiosError } from 'axios';
import { INekomiUploadsAPI_UploadFile, TEpisodeQuality, TUploadType } from '~/core/Interfaces/API/INekomiUploadsAPI';
import { Logger } from '~/services/LoggerService';
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

    const url = `${baseURL}/upload`;
    Logger.trace(`[NekomiUploadsAPI]: POST - ${url}`);

    const { data } = await $upload.post<INekomiUploadsAPI_UploadFile>(url, formData);

    Logger.debug(`[NekomiUploads]: Upload created. [id: ${data.id}; by: ${uploadedById}]`);

    return data;
  }

  static async deleteUpload({ id, deletedById, withChildren }: IDeleteUploadProps) {
    try {
      const url = `${baseURL}/upload/${id}`;
      Logger.trace(`[NekomiUploadsAPI]: DELETE - ${url}`);

      await $upload.delete(url, {
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