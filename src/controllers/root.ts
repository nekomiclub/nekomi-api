import express from 'express';

import NekomiUploadsAPI from '~/core/services/API/NekomiUploadsAPI';
import { AxiosError } from 'axios';
import { E503, ERR_INVALID_PAYLOAD, ERR_MIDDLEWARE_REQUIRED, HandleRequest } from '~/services/ErrorService';
import { TUploadType } from '~/core/interfaces/API/NekomiUploadsAPI';





export async function postUpload(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');

    const userID = req.nekomi.user?.id;

    const file = req.file;
    if (!file) throw new ERR_INVALID_PAYLOAD('File is not provided');

    const { type } = req.body as { type: TUploadType };

    const UPLOAD_DATA: { url: string, id: string, srt_id?: string, frames?: number } = {
      url: '',
      id: '',
    };

    try {
      const postData = await NekomiUploadsAPI.uploadFile({ file, type, uploadedById: userID! });

      UPLOAD_DATA.url = postData.url;
      UPLOAD_DATA.id = postData.id;
      UPLOAD_DATA.frames = postData.frames;
      UPLOAD_DATA.srt_id = postData.srt_id;
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') {
          throw new E503('Nekomi-uploads is not available. Try in a few minutes');
        }

        throw e;
      } else {
        throw e;
      }
    }

    return res.status(201).json({ message: `File with type ${type} uploaded`, ...UPLOAD_DATA });
  });
}

export async function deleteUpload(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED('checkAccess');
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED('checkCSRF');

    const { id } = req.params as { id: string };
    const userID = req.nekomi.user?.id;

    try {
      await NekomiUploadsAPI.deleteUpload({ id, deletedById: userID!, withChildren: true });
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.code === 'ECONNREFUSED') {
          throw new E503('Nekomi-uploads is not available. Try in a few minutes');
        }

        throw e;
      } else {
        throw e;
      }
    }

    return res.status(201).json({ message: `Upload removed`, });
  });
}