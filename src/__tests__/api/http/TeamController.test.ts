import request from 'supertest';
import z from 'zod';
import { GetTeamExtendedSchema, GetTeamQuerySchema, GetTeamResponseSchema } from '~/api/http/TeamController/TeamGet.route';
import { GetTeamSearchQuerySchema, GetTeamSearchResponseSchema } from '~/api/http/TeamController/TeamGetSearch.route';
import { TeamMinifiedSchema } from '~/schemas/entities/Team.schema';
import { TeamRepositoryClass } from '~/repo/TeamRepository';
import { app } from '~/index';
import { beforeAll, describe, expect, it } from 'vitest';
import { shouldRejectCSRF } from '~/utils/testing-utils';



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

      const body = GetTeamResponseSchema.parse(res.body);

      expect(GetTeamResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
      expect(TeamMinifiedSchema.safeParse(body.team).success).toBeTruthy(); // Minified schema must be returned
    });



    it('Should retrieve extended team', async () => {
      const res = await request(app)
        .get(`/team/${teamService.document.id}`)
        .query({
          is_extended: true
        } satisfies z.infer<typeof GetTeamQuerySchema>)
        .expect(200)
        .set(`X-CSRF-Token`, `~dev`);

      const body = GetTeamResponseSchema.parse(res.body);

      expect(GetTeamResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
      expect(GetTeamExtendedSchema.safeParse(body.team).success).toBeTruthy(); // Extended schema must be returned
    });



    it('Should reject extended team retrieve is CSRF invalid', async () => {
      const res = await request(app)
        .get(`/team/${teamService.document.id}`)
        .query({
          is_extended: true
        } satisfies z.infer<typeof GetTeamQuerySchema>)
        .expect(401)
        .set(`X-CSRF-Token`, `_INVALID`);

      expect(res.body.code).toBe(`auth:csrf_token_invalid`); // Error code must match provided
    });
  });



  describe('GET /team/search', () => {
    it('Should search teams', async () => {
      const res = await request(app)
        .get('/team/search')
        .expect(200)
        .set('X-CSRF-Token', '~dev')
        .query({
          q: `~all`
        } satisfies z.infer<typeof GetTeamSearchQuerySchema>);

      expect(GetTeamSearchResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
    });



    it('Should reject invalid CSRF', async () => await shouldRejectCSRF('/team/search', 'get'));
  });



  // describe('PUT /team/:id/avatar', () => {

  // });



  // describe('PUT /team/:id/cover', () => {

  // });
});