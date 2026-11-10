import { NekomiUploadService } from '~/api/external/nekomi-upload-service.js';
import { NUS_UPLOAD_TYPE } from '~/interfaces/external-api/INekomiUploadService.api.js';
import { NekoError } from '~/services/ExceptionService.js';
import Logger from '~/services/LoggerService.js';



type IReplaceUploadArgs = {
  uploadType: NUS_UPLOAD_TYPE
  actorId: string

  defaultUrl: string
  previousUrl: string
}



/** 
 * Replace old upload with new one
 * 
 * @todo Rework in upcoming UploadRepository method, write tests
 * @returns CDNString
 */
async function replaceUpload(buffer: Buffer, args: IReplaceUploadArgs): Promise<string> {
  const { objects } = await NekomiUploadService.uploadFile({
    buffer,
    type: args.uploadType,
    uploaderId: args.actorId
  });

  const object = objects.find(el => el.type === args.uploadType);
  if (!object) throw new NekoError('nus:object_not_found', `"${args.uploadType}" object is not found in upload objects`);

  // Delete previous object if it is not default
  if (args.previousUrl !== args.defaultUrl && !args.previousUrl.includes('~default')) {
    try {
      await NekomiUploadService.deleteFile(NekomiUploadService.getId(args.previousUrl), args.actorId);
    } catch (e) {
      Logger.warn(`[replaceUpload]: Cannot delete previous object when replacing with a new one. [uploadType=${args.uploadType};actorId=${args.actorId}]`, e);
    }
  }

  return object.url;
}



export default replaceUpload;