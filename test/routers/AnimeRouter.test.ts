process.argv.push('testMode');
process.argv.push('devMode');

import request from 'supertest';
import { MockAccessCheck, MockCheckCSRF, testEnd, testStart } from '~/utils/testing';
import { app } from '~/index';
import { config } from '~/config';


beforeAll(testStart);
afterAll(testEnd);



describe('AnimeRouter', () => {
  const NekomiCSRFMock = MockCheckCSRF({ origin: config.DOMAIN.nekomi, verified: true });
  const RootAccessMock = MockAccessCheck({ id: config.vars.INTERNAL_ROOT_USER_ID, avatar: '~', capabilities: ['root'], username: '~' });

  describe('GET /anime/:query', () => {
    it(`should return anime document in detailed mode`, async () => {
      await request(app)
        .get(`/anime/0fc90fe6-8dcf-4eaa-8080-f0d933e76266`)
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock, RootAccessMock]))
        .set(config.vars.csrfHeader, '~')
        .query({
          detailed: true
        })
        .expect(200);
    });
  });
});