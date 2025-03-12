process.argv.push('testMode');
process.argv.push('devMode');

import Anime, { ANIME_MEDIA_TYPE } from '~/core/interfaces/AnimeIntf';
import AnimeService from '~/core/services/AnimeService';
import createID from '~/utils/create-id';
import request from 'supertest';
import { AnimeGetAll, AnimeGetByQuery, AnimeGetSearch } from '~/controllers/Anime/AnimeControllerTypes';
import { ERR_GENERIC } from '~/services/ErrorService';
import { MockAccessCheck, MockCheckCSRF, testPurge } from '~/utils/testing';
import { app } from '~/index';
import { config } from '~/config';


beforeAll(testPurge);
afterAll(testPurge);



describe('AnimeRouter', () => {
  const NekomiCSRFMock = MockCheckCSRF({ origin: config.DOMAIN.nekomi, verified: true });
  const RootAccessMock = MockAccessCheck({ id: config.vars.INTERNAL_ROOT_USER_ID, avatar: '~', capabilities: ['root'], username: '~' });



  describe('GET /anime/search', () => {
    let anime: Anime | null = null;

    beforeAll(async () => {
      anime = await new AnimeService().create({ nameEng: createID(12) });
    });

    it('should search by query', async () => {
      await request(app)
        .get('/anime/search')
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock]))
        .set(config.vars.csrfHeader, `~`)
        .query({
          q: anime?.uuid
        })
        .expect(200);
    });

    it('should return all documents (~all)', async () => {
      const res = await request(app)
        .get('/anime/search')
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock]))
        .set(config.vars.csrfHeader, `~`)
        .query({
          q: '~all'
        })
        .expect(200);

      const data = res.body.results as AnimeGetSearch;

      expect(data.length).toBeGreaterThan(1);
    });

    it('should return only without mal id (~wo-mal-id)', async () => {
      const res = await request(app)
        .get('/anime/search')
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock]))
        .set(config.vars.csrfHeader, `~`)
        .query({
          q: '~wo-mal-id'
        })
        .expect(200);

      const data = res.body.results as AnimeGetSearch;

      expect(data[0].anime.malId).toBeNull();
    });
  });

  describe('GET /anime/all', () => {
    it('should return total/updated/fullfilled anime documents', async () => {
      const res = await request(app)
        .get('/anime/all')
        .expect(200);

      const data = res.body as AnimeGetAll;

      expect(data.total).toBeGreaterThanOrEqual(data.updated);
      expect(data.updated).toBeGreaterThanOrEqual(data.fullfilled);
      expect(data.fullfilled).toBeGreaterThan(0);
    });
  });

  describe('GET /anime/:query', () => {
    let anime: Anime | null = null;

    beforeAll(async () => {
      anime = await new AnimeService().create({ nameEng: createID(12) });
    });

    it(`should return anime document in detailed mode`, async () => {
      const res = await request(app)
        .get(`/anime/${anime?.uuid}`)
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock]))
        .set(config.vars.csrfHeader, '~')
        .query({ detailed: true })
        .expect(200);

      const data = res.body as AnimeGetByQuery;

      expect(data.anime?.names.eng).toBeTruthy();
      expect(data.anime?.media).toBe(ANIME_MEDIA_TYPE.UNKNOWN);
      expect(data.anime?.episodes).not.toBeUndefined();
      expect(data.genres).not.toBeUndefined();
      expect(data.media).not.toBeUndefined();
      expect(data.rate).not.toBeUndefined();
      expect(data.season).not.toBeUndefined();
    });

    it(`should return anime document in private mode`, async () => {
      const res = await request(app)
        .get(`/anime/${anime?.uuid}`)
        .query({ detailed: false })
        .expect(200);

      const data = res.body as AnimeGetByQuery;

      expect(data.anime?.names.eng).toBeTruthy();
      expect(data.anime?.media).toBe(ANIME_MEDIA_TYPE.UNKNOWN);
      expect(data.anime?.episodes).toBeUndefined();
    });

    it('should reject detailed without csrf', async () => {
      const res = await request(app)
        .get(`/anime/${anime?.uuid}`)
        .query({ detailed: true, fetchDubbers: true })
        .expect(401);

      expect(res.body.code).toBe(ERR_GENERIC.MISSING_AUTHORIZATION);
    });

    it('should return only metadata', async () => {
      const res = await request(app)
        .get(`/anime/${anime?.uuid}`)
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock]))
        .set(config.vars.csrfHeader, '~')
        .query({ metadataOnly: true })
        .expect(200);

      const data = res.body as AnimeGetByQuery;

      expect(data.anime).toBeUndefined();
      expect(data.genres).toBeUndefined();
      expect(data.media).toBeUndefined();
      expect(data.rate).toBeUndefined();
      expect(data.season).toBeUndefined();

      expect(data.metadata).not.toBeUndefined();
    });


    it('should fetch dubbers & related', async () => {
      const res = await request(app)
        .get(`/anime/${anime?.uuid}`)
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock]))
        .set(config.vars.csrfHeader, '~')
        .query({ detailed: true, fetchDubbers: true, fetchRelated: true })
        .expect(200);

      const data = res.body as AnimeGetByQuery;

      expect(data.dubbers).not.toBeUndefined();
      expect(data.related).not.toBeUndefined();
    });
  });
});