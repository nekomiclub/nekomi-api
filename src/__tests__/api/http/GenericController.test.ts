import '~/service/openapi/setup';

import conf from '~/conf';
import request from 'supertest';
import z from 'zod';
import { GetHomeFeedRouteSchema } from '~/api/http/GenericController/GetHomeFeed.route';
import { GetPingResponseSchema } from '~/api/http/GenericController/GetPing.route';
import { app } from '~/index';
import { describe, expect, it } from 'vitest';
import { shouldRejectAPIKey } from '~/utils/testing-utils';



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



  describe('GET /home-feed', () => {
    it('Should return home feed data & cache it', async () => {
      const res = await request(app)
        .get(`/home-feed`)
        .expect(200)
        .set(`X-API-Key`, conf.env.API_KEY_SK);

      const body = res.body as z.infer<typeof GetHomeFeedRouteSchema.ResponseSchema>;

      expect(GetHomeFeedRouteSchema.ResponseSchema.safeParse(body).success).toBeTruthy(); // Response must match schema
      expect(res.headers['X-HomeFeedCacheUsed'.toLowerCase()]).toBe('false'); // First request must be uncached

      // === SECOND REQUEST
      const resCached = await request(app)
        .get(`/home-feed`)
        .expect(200)
        .set(`X-API-Key`, conf.env.API_KEY_SK);

      expect(resCached.headers['X-HomeFeedCacheUsed'.toLowerCase()]).toBe('true'); // Second request must be cached
    });



    it('Should reject invalid API Key', async () => await shouldRejectAPIKey('/home-feed', 'get'));
  });
});