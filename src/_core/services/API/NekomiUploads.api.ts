import { $upload } from '~/services/HTTPService';
import { AnimeEpisodeQualityType, NekomiUploadType, NekomiUploadsAPI_UploadFile } from '~/core/interfaces/API/NekomiUploadsAPI';
import { HandleAPIErorr } from '~/services/ErrorService';
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
export class NekomiUploadsAPI {
  static getUploadIdFromURL(url: string): string {
    return url.split('/')[url.split('/').length - 1];
  }

  static async uploadFile({ file, uploadedById, type, qualities }: IUploadFileProps): Promise<NekomiUploadsAPI_UploadFile> {
    try {
      const { buffer, originalname, mimetype } = file;

      const formData = new FormData();

      formData.append('file', new Blob([buffer], {
        type: mimetype
      }), originalname);
      formData.set('uploadedBy', uploadedById);
      formData.set('type', type);

      if (qualities?.length) formData.set('qualities', JSON.stringify(qualities));

      const url = `${baseURL}/upload`;
      Logger.trace(`[NekomiUploadsAPI]: POST - ${url.replace(baseURL, '')}`);

      const { data } = await $upload.post<NekomiUploadsAPI_UploadFile>(url, formData);

      Logger.debug(`[NekomiUploads]: Upload created. [id: ${data.id}; by: ${uploadedById}]`);

      return data;
    } catch (e) {
      HandleAPIErorr(e, APINAME);
    }
  }

  static async deleteUpload({ id, deletedById, withChildren }: IDeleteUploadProps) {
    try {
      const url = `${baseURL}/upload/${id}`;
      Logger.trace(`[NekomiUploadsAPI]: DELETE - ${url.replace(baseURL, '')}`);

      await $upload.delete(url, {
        params: {
          by: deletedById,
          withChildren
        }
      });

      Logger.debug(`[NekomiUploads]: Upload deleted. [id: ${id}; by: ${deletedById}]`);
    } catch (e) {
      HandleAPIErorr(e, APINAME);
    }
  }
}



export default NekomiUploadsAPI;