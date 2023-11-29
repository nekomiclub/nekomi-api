import express from 'express';
import * as v1C from './controllers/v1';

export const ApiV1 = express.Router();

ApiV1.get(`/title/:id`, v1C.getTitle);
ApiV1.get(`/titles`, v1C.getTitles);
ApiV1.get(`/global_stats`, v1C.getGS);
ApiV1.get(`/uptime`, v1C.uptime);

// Auth required
ApiV1.post('/upload', v1C.upload);