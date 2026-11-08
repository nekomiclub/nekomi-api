import '~/services/openapi/setup.js';

import conf from '~/conf.js';
import request from 'supertest';
import z from 'zod';
import { TeamGetRouteSchemas } from '~/api/http/TeamController/TeamGet.route.js';
import { TeamGetSearchRouteSchemas } from '~/api/http/TeamController/TeamGetSearch.route.js';
import { TeamMinifiedSchema, TeamPublicSchema } from '~/schemas/entities/Team.schema.js';
import { TeamRepositoryClass } from '~/repositories/TeamRepository.js';
import { app } from '~/index.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { shouldRejectAPIKey } from '~/utils/testing-utils.js';



describe('Test Auth HTTP API Controller', () => {
  describe('GET /team/:query', () => {
    const teamService = new TeamRepositoryClass();

    beforeAll(async () => {
      await teamService.create();
    });



    it('Should retrieve team', async () => {
      const res = await request(app)
        .get(`/team/${teamService.document.id}`)
        .expect(200);

      const body = TeamGetRouteSchemas.ResponseSchema.parse(res.body);

      expect(TeamGetRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
      expect(TeamMinifiedSchema.safeParse(body.data.team).success).toBeTruthy(); // Minified schema must be returned
    });



    it('Should retrieve extended team', async () => {
      const res = await request(app)
        .get(`/team/${teamService.document.id}`)
        .query({
          is_extended: true
        } satisfies z.infer<typeof TeamGetRouteSchemas.RequestQuerySchema>)
        .expect(200)
        .set(`X-API-Key`, conf.env.API_KEY_SK);

      const body = TeamGetRouteSchemas.ResponseSchema.parse(res.body);

      expect(TeamGetRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
      expect(TeamPublicSchema.safeParse(body.data.team).success).toBeTruthy(); // Extended schema must be returned
    });



    it('Should reject extended team retrieve is API Key invalid', async () => {
      const res = await request(app)
        .get(`/team/${teamService.document.id}`)
        .query({
          is_extended: true
        } satisfies z.infer<typeof TeamGetRouteSchemas.RequestQuerySchema>)
        .expect(401)
        .set(`X-API-Key`, `_INVALID`);

      expect(res.body.code).toBe(`auth:api_key_invalid`); // Error code must match provided
    });
  });



  describe('GET /team/search', () => {
    it('Should search teams', async () => {
      const res = await request(app)
        .get('/team/search')
        .expect(200)
        .set('X-API-Key', conf.env.API_KEY_SK)
        .query({
          q: `~all`
        } satisfies z.infer<typeof TeamGetSearchRouteSchemas.RequestQuerySchema>);

      expect(TeamGetSearchRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
    });



    it('Should reject invalid API Key', async () => await shouldRejectAPIKey('/team/search', 'get'));
  });



  // describe('PUT /team/:id/avatar', () => {

  // });



  // describe('PUT /team/:id/cover', () => {

  // });
});