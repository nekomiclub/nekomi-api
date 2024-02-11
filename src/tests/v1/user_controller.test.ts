import request from 'supertest';
import { config } from '../../config';

const baseURL = `http://${config.service.HOST}:${config.service.PORTS.HTTP}`;

describe('V1 User controller', () => {
  //! ROOT TITLEUPDATER IS REQUIRED

  test('Get one (/user/:id)', async () => {
    const res = await request(baseURL)
      .get(`/v1/user/root-titleupdater`)
      .expect(200);
  });
});