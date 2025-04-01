process.argv.push('testMode');
process.argv.push('devMode');

import { MockAccessCheck, MockCheckCSRF } from '~/utils/testing';
import { config } from '~/config';



// beforeAll(testPurge);
// afterAll(testPurge);



describe('UserRouter', () => {
  const NekomiCSRFMock = MockCheckCSRF({ origin: config.DOMAIN.nekomi, verified: true });
  const RootAccessMock = MockAccessCheck({ id: config.vars.INTERNAL_ROOT_USER_ID, avatar: '~', capabilities: ['root'], username: '~' });



  it('TBD', () => expect(true).toBeTruthy());

  // describe('GET /user/search', () => {
  //   it(`should search user by query`, async () => { });
  //   it(`should return all documents (~all)`, async () => { });
  //   it(`should parse invitation status (~all)`, async () => { });
  // });



  // describe('PATCH /user/me', () => {
  //   it(`should patch user watch progress`, async () => { });
  //   it(`should delete user watch progress`, async () => { });
  // });
});