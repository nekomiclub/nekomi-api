import express from 'express';
import * as v1C from './controllers/v1';
import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import Storage from './Models/Storage';

export const ApiV1 = express.Router();
const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, `${path.resolve()}/tmp/uploads`);
  },
  async filename(req, file, callback) {
    const filename = file.originalname;
    const ext = filename.substring(filename.lastIndexOf('.') + 1, filename.length);
    const id = `${(process.argv.some(el => el === 'testMode')) ? 'testid-' : ''}${uuid.v4()}`;
    callback(null, `${id}.${ext}`);

    const storage = new Storage({
      id,
      URI: `${path.resolve()}/tmp/uploads/${id}.${ext}`,
      dateAdded: +new Date()
    });

    req.body = {
      ...req.body,
      id
    };

    await storage.save();
  },
});
const upload = multer({ storage });

ApiV1.get(`/title/:id`, v1C.getTitle);
ApiV1.get(`/titles`, v1C.getTitles);
ApiV1.get(`/global_stats`, v1C.getGS);
ApiV1.get(`/uptime`, v1C.uptime);
ApiV1.get(`/media/:id`, v1C.media);

// Auth required
ApiV1.post('/upload', upload.fields([{ name: 'file' }, { name: 'type' }]), v1C.upload);