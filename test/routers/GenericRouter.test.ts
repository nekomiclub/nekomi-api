process.argv.push('testMode');
process.argv.push('devMode');

import request from 'supertest';
import { app } from '~/index';
import { testPurge } from '~/utils/testing';



beforeAll(testPurge);
afterAll(testPurge);



describe('GenericRouter', () => {
  describe('GET /ping', () => {
    it('should return current commit & startedAt', async () => {
      const { body } = await request(app)
        .get('/ping')
        .expect(200);

      expect(body.commit).toBeTruthy();
      expect(body.startedAt).toBeTruthy();
    });
  });
});