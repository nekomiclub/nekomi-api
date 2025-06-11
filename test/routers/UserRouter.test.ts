process.argv.push('testMode');
process.argv.push('devMode');

import UserService from '~/core/services/UserService';
import mongoose from 'mongoose';
import request from 'supertest';
import { MockAccessCheck, MockCheckCSRF } from '~/utils/testing-utils';
import { app } from '~/index';
import { config } from '~/config';
import { createStringID } from '~/utils/utils';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



describe('UserRouter', () => {
  const NekomiCSRFMock = MockCheckCSRF({ origin: config.DOMAIN.nekomi, verified: true });
  const RootAccessMock = MockAccessCheck({ id: config.vars.INTERNAL_ROOT_USER_ID, avatar: '~', capabilities: ['root'], username: '~' });

  const userService = new UserService();



  beforeAll(async () => {
    const user = await new UserService().create({ username: createStringID(12) });

    await userService.init(user.id);
  });



  describe(`GET /user`, () => {
    it('should get by query', async () => { });
    it('should get by session', async () => { });
    it('should validate session and reject if session invalid', async () => { });

    it('should sync user avatar & username with fullkekw-userapi (MiddlewareService/checkAccess)', async () => {
      const newAvatar = 'https://lolkek.com';
      const UserAccessMock = MockAccessCheck({ id: userService.user.id, avatar: newAvatar, capabilities: ['root'], username: '~' });

      expect(userService.user.avatar).not.toBe(newAvatar);

      const res = await request(app)
        .get(`/user/*`)
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock, UserAccessMock]))
        .set(config.vars.csrfHeader, '~')
        .set(`Cookie`, `${config.vars.sessionCookie}=~`)
        .expect(200);

      const body = res.body;

      expect(body.user.avatar).toBe(newAvatar);
    });
  });



  describe('GET /user/search', () => {
    it(`should search user by query`, async () => { });
    it(`should return all documents (~all)`, async () => { });
    it(`should parse invitation status (~all)`, async () => { });
  });



  describe('PATCH /user/me', () => {
    it(`should patch user watch progress`, async () => { });
    it(`should delete user watch progress`, async () => { });
  });
});