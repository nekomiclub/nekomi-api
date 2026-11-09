import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import z from 'zod';

import { AuthGetLogoutRouteSchemas } from '~/api/http/AuthController/AuthGetLogout.route.js';
import { AuthPostRouteSchemas } from '~/api/http/AuthController/AuthPost.route.js';
import conf from '~/conf.js';
import { app } from '~/index.js';
import { UserRepositoryClass } from '~/repositories/UserRepository.js';
import { AUTH_METHOD } from '~/schemas/auth.schema.js';
import SessionService from '~/services/SessionService.js';
import { createNanoId } from '~/utils/create-id.js';
import env from '~/utils/env.js';
import { shouldRejectAPIKey, supertestCookieExist, supertestCookieRemoved } from '~/utils/testing-utils.js';



describe(`Test Auth HTTP API Controller`, () => {
  describe('POST /auth', () => {
    let userService = new UserRepositoryClass();
    const testEmail = `testing_${createNanoId(4)}@nekomi.club`;

    beforeAll(async () => {
      await userService.create();

      userService.setEmail(testEmail);
      await userService.save();
    });



    it(`Should login with google provider`, async () => await invokePostAuth({ email: testEmail }));



    it(`Should create new user with google provider`, async () => await invokePostAuth({ email: `testing_${createNanoId(12)}@nekomi.club` }));



    it(`Should reject login with google provider if token is not provided`, async () => {
      const res = await request(app)
        .post('/auth')
        .set(`X-API-Key`, env('API_KEY_SK'))
        .expect(401)
        .send({
          method: AUTH_METHOD.GOOGLE,
        } satisfies z.infer<typeof AuthPostRouteSchemas.RequestBodySchema>);

      expect(res.body.code).toBe('auth:token_miss'); // Error code must match provided
    });



    it(`Should reject invalid API Key`, async () => await shouldRejectAPIKey('/auth', 'post'));



    async function invokePostAuth({ email }: { email: string }) {
      const res = await request(app)
        .post('/auth')
        .set(`X-API-Key`, env('API_KEY_SK'))
        .send({
          method: AUTH_METHOD.GOOGLE,
          token: email
        } satisfies z.infer<typeof AuthPostRouteSchemas.RequestBodySchema>);

      const body = res.body as z.infer<typeof AuthPostRouteSchemas.ResponseSchema>;
      console.log(body);

      expect(AuthPostRouteSchemas.ResponseSchema.safeParse(body).success).toBeTruthy(); // Response must match schema
      expect(supertestCookieExist(res.headers, conf.variables.SESSION_COOKIE_NAME)).toBeTruthy(); // Cookie must be assigned
    }
  });



  describe('GET /auth/logout', () => {
    const userService = new UserRepositoryClass();

    beforeAll(async () => {
      await userService.create();
    });



    it(`Should logout current session`, async () => {
      const sessionService = new SessionService();

      await sessionService.init(userService!.document.id);
      const session = await sessionService.open();

      const res = await request(app)
        .get('/auth/logout')
        .expect(200)
        .set(`X-API-Key`, env('API_KEY_SK'))
        .set('Cookie', `${conf.variables.SESSION_COOKIE_NAME}=${session.token}`);

      expect(AuthGetLogoutRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
      expect(supertestCookieRemoved(res.headers, conf.variables.SESSION_COOKIE_NAME)).toBeTruthy(); // Cookie must be removed



      // Ensure that user session revoked
      const updatedUserService = new UserRepositoryClass();

      await updatedUserService.init(userService!.document.id);

      expect(updatedUserService.document.sessions.some(el => el.id === session.session.id)).toBeFalsy(); // Session must be revoked
    });



    it(`Should logout specified session`, async () => {
      const sessionService = new SessionService();

      await sessionService.init(userService!.document.id!);
      const session = await sessionService.open({ is_limited: false });
      const sessionTarget = await sessionService.open();

      const res = await request(app)
        .get(`/auth/logout/${sessionTarget.session.id}`)
        .expect(200)
        .set(`X-API-Key`, env('API_KEY_SK'))
        .set('Cookie', `${conf.variables.SESSION_COOKIE_NAME}=${session.token}`);

      expect(AuthGetLogoutRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
      expect(supertestCookieRemoved(res.headers, conf.variables.SESSION_COOKIE_NAME)).toBeFalsy(); // Cookie must not removed


      // Ensure that user session revoked
      const updatedUserService = new UserRepositoryClass();

      await updatedUserService.init(userService!.document.id);

      expect(updatedUserService.document.sessions.some(el => el.id === session.session.id)).toBeTruthy(); // Current session must not be revoked
      expect(updatedUserService.document.sessions.some(el => el.id === sessionTarget.session.id)).toBeFalsy(); // Session must be revoked
    });



    it(`Should remove session cookie on error`, async () => {
      const res = await request(app)
        .get(`/auth/logout/_INVALID`)
        .expect(200)
        .set(`X-API-Key`, env('API_KEY_SK'))
        .set('Cookie', `${conf.variables.SESSION_COOKIE_NAME}=_INVALID`);

      expect(supertestCookieRemoved(res.headers, conf.variables.SESSION_COOKIE_NAME)).toBeTruthy(); // Cookie must be removed
    });



    it(`Should reject invalid API Key`, async () => await shouldRejectAPIKey('/auth/logout/_INVALID', 'get'));
  });
});