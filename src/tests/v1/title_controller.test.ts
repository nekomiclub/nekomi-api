import request from 'supertest';
import { config } from '../../config';

const baseURL = `http://${config.service.HOST}:${config.service.PORTS.HTTP}`;

describe('V1 Title controller', () => {
  //! KONOSUBA-3 IS REQUIRED FOR TEST CASES. IF THIS TITLE WILL NOT EXIST, TESTS WILL FAIL.

  test('Get one by id (GET /title/:query)', async () => {
    const res = await request(baseURL)
      .get(`/v1/title/0fc90fe6-8dcf-4eaa-8080-f0d933e76266`); // Konosuba-3 for e.g

    expect(res.statusCode === 200); // 200 if title exist, 404 if title does not exist
  });

  test('Get one by code (GET /title/:query)', async () => {
    const res = await request(baseURL)
      .get(`/v1/title/konosuba-3`); // Konosuba-3 for e.g

    expect(res.statusCode === 200 || res.statusCode === 404); // 200 if title exist, 404 if title does not exist
  });

  test('Get many (GET /titles)', async () => {
    const res = await request(baseURL)
      .get(`/v1/titles`);

    expect(res.body.results.length > 1 || res.body.total >= 0);
  });

  test('Search konosuba', async () => {
    const res = await request(baseURL)
      .get(`/v1/titles/search?query=konosuba`);

    expect(res.body.results.length >= 1);
  });

  test('Get total (/titles/total)', async () => {
    const res = await request(baseURL)
      .get(`/v1/titles/total`);

    expect(res.body.total >= 1 && res.body.renewed >= 1);
  });
});