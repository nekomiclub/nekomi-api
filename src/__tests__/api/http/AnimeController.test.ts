import request from 'supertest';
import z from 'zod';
import { AnimeGetEpisodesRouteSchemas } from '~/api/http/AnimeController/AnimeGetEpisodes.route';
import { AnimeGetSearchRouteSchemas } from '~/api/http/AnimeController/AnimeGetSearch.route';
import { AnimeRepositoryClass } from '~/repo/AnimeRepository';
import { app } from '~/index';
import { beforeAll, describe, expect, it } from 'vitest';
import { shouldRejectCSRF } from '~/utils/testing-utils';



describe('Test Anime HTTP API Controller', () => {
  const animeService = new AnimeRepositoryClass();

  beforeAll(async () => {
    await animeService.create();

    // TODO: Append episode to enhance test GET /episodes
  });



  describe('GET /anime/search', () => {
    it('Should search anime documents', async () => {
      const res = await request(app)
        .get('/anime/search')
        .expect(200)
        .set('X-CSRF-Token', '~dev')
        .query({
          q: '~all'
        } satisfies z.infer<typeof AnimeGetSearchRouteSchemas.RequestQuerySchema>);

      expect(AnimeGetSearchRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
    });



    it('Should reject invalid CSRF', async () => await shouldRejectCSRF('/anime/search', 'get'));
  });



  // describe('GET /anime/:query', () => {
  //   it('Should retrieve minified anime document', async () => { })
  //   it('Should retrieve extended anime document', async () => { })
  //   it('Should retrieve extended anime document', async () => { })
  // })



  describe('GET /anime/:query/episodes', () => {
    it('Should return anime episodes', async () => {
      const res = await request(app)
        .get(`/anime/${animeService.document.id}/episodes`)
        .set('X-CSRF-Token', '~dev')
        .expect(200);

      expect(AnimeGetEpisodesRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy();
    });



    it('Should reject invalid CSRF', async () => await shouldRejectCSRF(`/anime/${animeService.document.id}/episodes`, 'get'));
  });



  // describe('GET /anime/:query/parse', () => {

  //  })
});