import '~/services/openapi/setup.js';

import env from '~/utils/env.js';
import request from 'supertest';
import { AnimeGetEpisodesRouteSchemas } from '~/api/http/AnimeController/AnimeGetEpisodes.route.js';
import { AnimeRepositoryClass } from '~/repositories/AnimeRepository.js';
import { app } from '~/index.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { shouldRejectAPIKey } from '~/utils/testing-utils.js';



describe('Test Anime HTTP API Controller', () => {
  const animeService = new AnimeRepositoryClass();

  beforeAll(async () => {
    await animeService.create();

    // TODO: Append episode to enhance test GET /episodes
  });



  // describe('GET /anime/search', () => {
  //   it('Should search anime documents', async () => {
  //     const res = await request(app)
  //       .get('/anime/search')
  //       .expect(200)
  //       .set('X-API-Key', env('API_KEY_SK'))
  //       .query({
  //         q: '~all'
  //       } satisfies z.infer<typeof AnimeGetSearchRouteSchemas.RequestQuerySchema>);

  //     expect(AnimeGetSearchRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy(); // Response must match schema
  //   });



  //   it('Should reject invalid API Key', async () => await shouldRejectAPIKey('/anime/search', 'get'));
  // });



  // describe('GET /anime/:query', () => {
  //   it('Should retrieve minified anime document', async () => { })
  //   it('Should retrieve extended anime document', async () => { })
  //   it('Should retrieve extended anime document', async () => { })
  // })



  describe('GET /anime/:query/episodes', () => {
    it('Should return anime episodes', async () => {
      const res = await request(app)
        .get(`/anime/${animeService.document.id}/episodes`)
        .set('X-API-Key', env('API_KEY_SK'))
        .expect(200);

      expect(AnimeGetEpisodesRouteSchemas.ResponseSchema.safeParse(res.body).success).toBeTruthy();
    });



    it('Should reject invalid API Key', async () => await shouldRejectAPIKey(`/anime/${animeService.document.id}/episodes`, 'get'));
  });



  // describe('GET /anime/:query/parse', () => {

  //  })
});