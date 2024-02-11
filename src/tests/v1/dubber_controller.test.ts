import request from 'supertest';
import { config } from '../../config';

const baseURL = `http://${config.service.HOST}:${config.service.PORTS.HTTP}`;

describe('V1 Dubber controller', () => {
  test('Get one (Didko for e.g)', async () => {
    const res = await request(baseURL)
      .get('/v1/dubber/fd203550-19cc-4fd0-af4c-10050104a4d6'); // Didko in both DB`s

    expect(res.body.code).toBe('didko-studio');
  });
});