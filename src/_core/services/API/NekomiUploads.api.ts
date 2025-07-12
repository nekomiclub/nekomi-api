import { $upload } from '~/services/HTTPService';
import { AnimeEpisodeQualityType, NekomiUploadType, NekomiUploads_UploadFile } from '~/core/interfaces/API/NekomiUploadsAPI';
import { HandleAPIError } from '~/services/ErrorService';
import { Logger } from '~/services/LoggerService';
import { config } from '~/config';



interface IUploadFileProps {
  file: Express.Multer.File
  uploadedById: string
  type: NekomiUploadType
  qualities?: AnimeEpisodeQualityType[]
}

interface IDeleteUploadProps {
  id: string
  deletedById: string
  withChildren?: boolean
}



const baseURL = config.URL.nekomi_uploads;
const APINAME = 'nekomi-uploads';



/** @version 2.1.0 */
export class NekomiUploads {
  static getUploadIdFromURL(url: string): string {
    return url.split('/')[url.split('/').length - 1];
  }

  static async uploadFile({ file, uploadedById, type, qualities }: IUploadFileProps): Promise<NekomiUploads_UploadFile> {
    try {
      const { buffer, originalname, mimetype } = file;

      const formData = new FormData();

      formData.append('file', new Blob([buffer], {
        type: mimetype
      }), originalname);
      formData.set('uploadedBy', uploadedById);
      formData.set('type', type);

      if (qualities?.length) formData.set('qualities', JSON.stringify(qualities));

      const { data } = await $upload.post<NekomiUploads_UploadFile>(`${baseURL}/upload`, formData);

      Logger.debug(`[NekomiUploads]: Upload created. [id: ${data.id}; by: ${uploadedById}]`);

      return data;
    } catch (e) {
      HandleAPIError(e, APINAME);
    }
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
      HandleAPIError(e, APINAME);
    }
  }
}



export default NekomiUploads;