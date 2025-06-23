process.argv.push('testMode');
process.argv.push('devMode');

import Anime, { ANIME_MEDIA_TYPE } from '~/core/interfaces/Anime.intf';
import AnimeService from '~/core/services/AnimeService';
import TokenService from '~/services/TokenService';
import mongoose from 'mongoose';
import request from 'supertest';
import { AnimeGetByQuery, AnimeGetSearch, AnimeGetStats } from '~/controllers/Anime/AnimeControllerTypes';
import { ERROR } from '~/services/ErrorService';
import { MockAccessCheck, MockCheckCSRF } from '~/utils/jest-utils';
import { app } from '~/index';
import { config } from '~/config';
import { createStringID } from '~/utils/utils';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



describe('AnimeRouter', () => {
  const NekomiCSRFMock = MockCheckCSRF({ origin: config.DOMAIN.nekomi, verified: true });
  const RootAccessMock = MockAccessCheck({ id: config.vars.INTERNAL_ROOT_USER_ID, avatar: '~', capabilities: ['root'], username: '~' });



  describe('GET /anime/search', () => {
    let anime: Anime | null = null;

    beforeAll(async () => {
      anime = await new AnimeService().create({ nameEng: createStringID(12) });
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

      const data = res.body as AnimeGetSearch;

      expect(data.results.length).toBeGreaterThan(1);
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

      const data = res.body as AnimeGetSearch;

      expect(data.results[0].anime.malId).toBeNull();
    });
  });

  describe('GET /anime/stats', () => {
    it('should return total/updated/fullfilled anime documents', async () => {
      const res = await request(app)
        .get('/anime/stats')
        .expect(200);

      const data = res.body as AnimeGetStats;

      expect(data.total).toBeGreaterThanOrEqual(data.updated);
      expect(data.updated).toBeGreaterThanOrEqual(data.fullfilled);
      expect(data.fullfilled).toBeGreaterThan(0);
    });
  });

  describe('GET /anime/:query', () => {
    let anime: Anime | null = null;

    beforeAll(async () => {
      anime = await new AnimeService().create({ nameEng: createStringID(12) });
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
      expect(data.posterAdapt).not.toBeUndefined();
      expect(data.nextBroadcast).not.toBeUndefined();
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

      expect(res.body.code).toBe(ERROR.HTTP_UNAUTHORIZED);
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

  describe('GET /anime/featured', () => {
    it('should return featured animes', async () => {
      const { body } = await request(app)
        .get('/anime/featured')
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock]))
        .set(config.vars.csrfHeader, '~')
        .expect(200);

      expect(body.headliners).not.toBeUndefined();
      expect(body.hot).not.toBeUndefined();
      expect(body.updatedRecently).not.toBeUndefined();
      expect(body.rated).not.toBeUndefined();
    });
  });

  describe('POST /anime', () => {
    it('should create', async () => {
      const { body } = await request(app)
        .post('/anime')
        .set(config.vars.csrfHeader, '~')
        .set(`Cookie`, `${config.vars.sessionCookie}=~`)
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock, RootAccessMock]))
        .expect(201);

      expect(body.anime.uuid).toBeTruthy();
    });
  });

  describe('DELETE /anime/:uuid', () => {
    it('should delete', async () => {
      const anime = await new AnimeService().create({ nameEng: createStringID(12) });

      await request(app)
        .delete(`/anime/${anime.uuid}`)
        .query(`token=${TokenService.signCSRF()}`)
        .set(config.vars.csrfHeader, '~')
        .set(`Cookie`, `${config.vars.sessionCookie}=~`)
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock, RootAccessMock]))
        .expect(200);

      const afterDeleteAnime = await new AnimeService().safeGetByQuery(anime.uuid);

      expect(afterDeleteAnime).toBeNull();
    });

    it(`should reject`, async () => {
      await request(app)
        .delete(`/anime/SOME_ID`)
        .set(config.vars.csrfHeader, '~')
        .set(`Cookie`, `${config.vars.sessionCookie}=~`)
        .set(config.vars.mockHeader, JSON.stringify([NekomiCSRFMock, RootAccessMock]))
        .expect(401);
    });
  });
});