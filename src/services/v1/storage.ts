import fs from 'fs';
import path from 'path';
import * as uuid from 'uuid';
import Storage from '../../Models/Storage';
import { IUploadRequest, IUploadResponse } from '../../core/IUpload';
import cfg from '../../config';

export async function store(id: string) {
  console.log(cfg.storageURIs);
  console.log(id);
}