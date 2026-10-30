import CSRFService from '~/service/CSRFService';
import conf from '~/conf';
import request from 'supertest';
import z from 'zod';
import { GetCSRFBodySchema, GetCSRFResponseSchema } from '~/api/http/GenericController/GetCSRF.route';
import { GetHomeFeedRouteSchema } from '~/api/http/GenericController/GetHomeFeed.route';
import { GetPingResponseSchema } from '~/api/http/GenericController/GetPing.route';
import { app } from '~/index';
import { describe, expect, it } from 'vitest';
import { shouldRejectCSRF } from '~/utils/testing-utils';



describe(`Test Generic HTTP API Controller`, () => {
  describe('GET / (ping)', () => {
    it(`Should ping api & return valid payload`, async () => {
      const res = await request(app)
        .get('/')
        .expect(200);

      const body = res.body as z.infer<typeof GetPingResponseSchema>;

      expect(GetPingResponseSchema.safeParse(body).success).toBeTruthy(); // Response must match schema
    });
  });



  describe('GET /csrf', () => {
    it(`Should verify valid CSRF token (with orifin specified)`, async () => {
      await invokeValidCSRF({
        token: CSRFService.signToken(),
        origin: conf.domains.NEKOMI_API_DOMAIN
      });
    });



    it(`Should verify invalid CSRF token (without specified origin)`, async () => {
      await invokeValidCSRF({
        token: CSRFService.signToken(),
      });
    });



    it(`Should verify invalid CSRF token`, async () => {
      const res = await request(app)
        .get('/csrf')
        .expect(200)
        .send({
          token: CSRFService.signToken(),
          origin: conf.domains.NEKOMI_AUTH_DOMAIN
        } satisfies z.infer<typeof GetCSRFBodySchema>);

      const body = res.body as z.infer<typeof GetCSRFResponseSchema>;

      expect(GetCSRFResponseSchema.safeParse(body).success).toBeTruthy(); // Response must match schema
      expect(body.verified).toBeFalsy(); // Token must not be verified
      expect(body.origin).toBe(conf.domains.NEKOMI_API_DOMAIN); // Token must be issued by nekomi api 
    });



    async function invokeValidCSRF(payload: z.infer<typeof GetCSRFBodySchema>) {
      const res = await request(app)
        .get('/csrf')
        .expect(200)
        .send(payload);

      const body = res.body as z.infer<typeof GetCSRFResponseSchema>;

      expect(GetCSRFResponseSchema.safeParse(body).success).toBeTruthy(); // Response must match schema
      expect(body.verified).toBeTruthy(); // Token must be verified
      expect(body.origin).toBe(conf.domains.NEKOMI_API_DOMAIN); // Token must be issued by nekomi api 
    }
  });



  describe('GET /home-feed', () => {
    it('Should return home feed data & cache it', async () => {
      const res = await request(app)
        .get(`/home-feed`)
        .expect(200)
        .set(`X-CSRF-Token`, `~dev`);

      const body = res.body as z.infer<typeof GetHomeFeedRouteSchema.ResponseSchema>;

      expect(GetHomeFeedRouteSchema.ResponseSchema.safeParse(body).success).toBeTruthy(); // Response must match schema
      expect(res.headers['X-HomeFeedCacheUsed'.toLowerCase()]).toBe('false'); // First request must be uncached

      // === SECOND REQUEST
      const resCached = await request(app)
        .get(`/home-feed`)
        .expect(200)
        .set(`X-CSRF-Token`, `~dev`);

      expect(resCached.headers['X-HomeFeedCacheUsed'.toLowerCase()]).toBe('true'); // Second request must be cached
    });



    it('Should reject invalid CSRF', async () => await shouldRejectCSRF('/home-feed', 'get'));
  });
});