import express from 'express';
import * as v1C from './controllers/v1';
import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import Storage from './Models/Storage';
import { privateRoute, uploadValidity } from './middlewares';
import { uploadStorage } from './services/v1/storage';

export const ApiV1 = express.Router();
const upload = multer({ storage: uploadStorage });

ApiV1.get(`/title/:id`, v1C.getTitle);
ApiV1.get(`/titles`, v1C.getTitles);
ApiV1.get(`/global_stats`, v1C.getGS);
ApiV1.get(`/uptime`, v1C.uptime);
ApiV1.get(`/media/:id`, v1C.media);

// Private
ApiV1.post('/upload', privateRoute, upload.fields([{ name: 'file' }, { name: 'type' }]), uploadValidity, v1C.upload);