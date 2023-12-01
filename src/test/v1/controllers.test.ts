import request, { Response } from 'supertest';
import * as dotenv from 'dotenv';
import { IEnv } from '../../env';
import { app } from '../../index';
import { IUploadRequest } from '../../core/IUpload';
import fs from 'fs';
import path from 'path';

dotenv.config();

// @ts-expect-error 123
const env = process.env as IEnv;
const ip = `${env.IP}:${env.PORT}`;

describe('v1 controllers', () => {
  test('Is server up', async () => {
    await request(ip).get('/v1/uptime')
      .expect(200);
  });

  // describe('POST /upload', () => {
  //   test('success', async () => {
  //     const req = request(ip);
  //     const res = await req.post('/v1/upload')
  //       .field('file', fs.readFileSync(`${path.resolve()}/src/test/dev-testBuff.jpg`))
  //       .field('type', 'photo/user/avatar');

  //     expect(res.body.id).toBeTruthy();
  //   });
  // });
});