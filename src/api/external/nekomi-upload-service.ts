import FormData from 'form-data';

import conf from '~/conf.js';
import { CDNString } from '~/interfaces/BrandedIds.js';
import { NUS_UPLOAD_TYPE } from '~/interfaces/external-api/INekomiUploadService.api.js';
import Logger from '~/services/LoggerService.js';
import { $http } from '~/utils/http-utils.js';



interface IUploadFileProps {
  buffer: Buffer
  type: NUS_UPLOAD_TYPE
  uploaderId: string
}

interface IUploadFileObject {
  id: string
  url: CDNString
  type: NUS_UPLOAD_TYPE
  hash: string
}

interface IUploadFile {
  id: string
  objects: IUploadFileObject[]
}



const baseURL = conf.variables.nekomi_uploads_service_url;

export class NekomiUploadService {
  static async uploadFile({ buffer, type, uploaderId }: IUploadFileProps): Promise<IUploadFile> {
    const url = `${baseURL}/upload`;
    // Logger.http(`[NekomiUploadService]: POST - ${url}`);

    const fd = new FormData();

    fd.append('file', buffer, {
      filename: uploaderId,
      contentType: 'image/png'
    });

    fd.append('type', type);
    fd.append('uploaderId', uploaderId);

    const res = await $http.post<IUploadFile>(url, fd, {
      headers: {
        ...fd.getHeaders()
      }
    });

    return res.data;
  }



  static async deleteFile(id: string, userId: string, purgeChildren?: boolean) {
    const url = `${baseURL}/upload/${id}`;
    Logger.http(`[NekomiUploadService]: DELETE - ${url}`);

    await $http.delete(url, {
      data: {
        userId,
        purgeChildren
      }
    });
  }



  static getId(val: string): string {
    return val.split('/')[val.split('/').length - 1].split('.')[0];
  }
}