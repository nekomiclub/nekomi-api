import fs from 'fs';
import path from 'path';
import * as uuid from 'uuid';
import Storage from '../../Models/Storage';
import { IUploadRequest, IUploadResponse } from '../../core/IUpload';
import cfg from '../../config';
import multer from 'multer';
import { E400, E500 } from '../../handlers/v1/Errors';
import checkDiskSpace from 'check-disk-space';
import { exec } from 'child_process';
import { getFileExtension } from '../../handlers/v1/handlers';
import * as handler from '../../handlers/v1/handlers';

export const uploadStorage = multer.diskStorage({
  destination(req, file, callback) {
    console.log('dest');
    console.log(cfg.uploadsURI);
    return callback(null, cfg.uploadsURI[0]);
  },
  async filename(req, file, callback) {
    const filename = file.originalname;
    const ext = filename.substring(filename.lastIndexOf('.') + 1, filename.length);

    console.log('file');
    console.log(filename);

    const id = `${(process.argv.some(el => el === 'testMode')) ? 'testid-' : ''}${uuid.v4()}`;

    if (req.query.update) {
      const item = await Storage.findOne({ id: req.query.update });

      if (!item) {
        return callback(new Error('Update reverted. Provided update id is not found in db.'), `123`);
      } else {
        const id = req.query.update;
        item!.URI = `${cfg.uploadsURI[0]}/${id}.${ext}`;
        await item.save();

        req.body = {
          ...req.body,
          id
        };

        return callback(null, `${id}.${ext}`);
      }
    }

    callback(null, `${id}.${ext}`);

    const storage = new Storage({
      id,
      URI: `${cfg.uploadsURI[0]}/${id}.${ext}`,
      dateAdded: handler.getUTCTime()
    });

    req.body = {
      ...req.body,
      id
    };

    await storage.save();
  },
});

export async function getFreeDiskURI(size: number): Promise<string> {
  size = size + 1000000;

  const availableStoragesURIs: string[] = [];

  for (const storageI in cfg.storageURIs) {
    const storageURI = cfg.storageURIs[storageI];

    if ((await checkDiskSpace(storageURI)).free > size) {
      availableStoragesURIs.push(storageURI);
    }
  }

  if (!availableStoragesURIs.length) {
    throw new E500('STORAGE HAS REACHED MAXIMUM CAPACITY, NEW CONTENT CAN NOT BE DOWNLOADED. PLEASE, CREATE ISSUE ABOUT THAT ASAP');
  }

  return availableStoragesURIs[0];
}

export async function store(id: string, URI?: string): Promise<string> {
  const item = await Storage.findOne({ id });

  if (!item && !URI) {
    throw new E400('Item with provided id is not found in storage.');
  }

  const freeURI = await getFreeDiskURI(fs.statSync(URI || item!.URI).size);
  const newURI = `${freeURI}/${id}.${getFileExtension(URI || item!.URI)}`;

  await new Promise(res => {
    exec(`copyfiles -f ${URI || item!.URI} ${freeURI}`, async () => {
      fs.rmSync(URI || item!.URI);

      item!.URI = newURI;
      await item!.save();
      res(1);
    });
  });

  return newURI;
}