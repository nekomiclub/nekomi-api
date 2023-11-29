import fs from 'fs';
import path from 'path';
import * as uuid from 'uuid';
import Storage from '../../Models/Storage';
import { IUploadRequest, IUploadResponse } from '../../core/IUpload';
import cfg from '../../config';

export async function uploadTmp({ ext, file }: IUploadRequest, test: boolean): Promise<IUploadResponse> {
  const id = `${(test) ? 'testid-' : ''}${uuid.v4()}`;

  fs.writeFileSync(`${path.resolve()}/tmp/uploads/${id}.${ext}`, Buffer.from(file.data));
  const storage = new Storage({
    id,
    URI: `${path.resolve()}/tmp/uploads/${id}.${ext}`,
    URL: `http://api.animee.club/v1/media/${id}`,
    dateAdded: +new Date()
  });

  await storage.save();

  return { id };
}

export async function store(id: string) {
  console.log(cfg.storageURIs);
  console.log(id);
}