process.argv.push('testMode');
process.argv.push('devMode');

import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '~/index';
import { config } from '~/config';


beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



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