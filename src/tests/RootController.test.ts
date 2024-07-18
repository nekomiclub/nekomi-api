import ip from 'ip';
import request from 'supertest';
import mongoose from 'mongoose';
import * as cfg from '../config';

import User, { createUser } from '../Models/User';
import Title, { TitlePatcher, createTitle } from '../Models/Title';
import { ITitle, TAnimeGenre } from '../interfaces/Title';
import { IM_AccessControl, IM_CSRFCheck, IMock } from '../interfaces/Mocks';
import { IFK_UsapiAuthRefresh } from '../interfaces/FullkekwResponses';
import Dubbers, { createDubber } from '../Models/Dubber';
import { ISearchExtended, updateSearch } from '../controllers/root';

const config = cfg.config;
const baseURL = `http://${ip.address()}`;

//* DB
beforeAll(() => {
  mongoose.set('strictQuery', false);

  mongoose.connect(`mongodb://${config.service.DB!.DEV.USR}:${config.service.DB!.DEV.PWD}@${config.db.HOST}:${config.db.PORT}/${config.service.DB!.DEV.DB_NAME}`, {
    retryWrites: true,
  }).catch(e => {
    console.error(e);
  });
});

afterAll(() => {
  mongoose.disconnect();
});



describe('Root Controller', () => {
  // Mock data
  const USER_QUERY = 'dummy';
  const TITLE_QUERY = 'konosuba-3';
  const TITLE_TOTAL_QUERY = '*';
  const DUBBER_QUERY = 'didko-studio';

  const CSRFMock: IMock<IM_CSRFCheck> = {
    id: 'CSRFCheck',
    code: 200,
    data: {
      verified: true,
      origin: 'animee.club'
    }
  };

  describe('GET /search', () => {
    test('Search user', async () => {
      const res = await request(baseURL)
        .get(`/search?q=${USER_QUERY}&engines=["user"]`)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .expect(200);

      const data = res.body as { msg: string, results: ISearchExtended[], totalResults: number };

      expect(data.totalResults).toBeGreaterThan(0);
      expect(data.results[0].type).toBe('user');
    });

    test('Search title', async () => {
      const res = await request(baseURL)
        .get(`/search?q=${TITLE_QUERY}&engines=["title"]`)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .expect(200);

      const data = res.body as { msg: string, results: ISearchExtended[], totalResults: number };

      expect(data.totalResults).toBeGreaterThan(0);
      expect(data.results[0].type).toBe('title');
    });

    test('Search dubber', async () => {
      const res = await request(baseURL)
        .get(`/search?q=${DUBBER_QUERY}&engines=["dubber"]`)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .expect(200);

      const data = res.body as { msg: string, results: ISearchExtended[], totalResults: number };

      expect(data.totalResults).toBeGreaterThan(0);
      expect(data.results[0].type).toBe('dubber');
    });

    test('Get titles list', async () => {
      const res = await request(baseURL)
        .get(`/search?q=${TITLE_TOTAL_QUERY}&engines=["title"]`)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .expect(200);

      const data = res.body as { msg: string, results: ISearchExtended[], totalResults: number };

      expect(data.totalResults).toBeGreaterThan(5);
      expect(data.results[0].type).toBe('title');
    });

    test('Correct limit & page', async () => {
      const limit = 10;

      const res = await request(baseURL)
        .get(`/search?q=${TITLE_TOTAL_QUERY}&engines=["title"]&limit=${limit}`)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .expect(200);

      const data = res.body as { msg: string, results: ISearchExtended[], totalResults: number };

      expect(data.results.length).toBe(limit);
      expect(data.totalResults).toBeGreaterThan(limit);
      expect(data.results[0].type).toBe('title');



      const resNd = await request(baseURL)
        .get(`/search?q=${TITLE_TOTAL_QUERY}&engines=["title"]&limit=${limit}&page=2`)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .expect(200);

      const dataNd = resNd.body as { msg: string, results: ISearchExtended[], totalResults: number };

      expect(data.results.length).toBe(limit);
      expect(data.totalResults).toBeGreaterThan(limit);
      expect(data.results[0].type).toBe('title');
      expect(data.results[0].item.id !== dataNd.results[0].item.id).toBeTruthy();
    });
  });
});