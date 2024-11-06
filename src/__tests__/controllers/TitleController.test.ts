import mongoose, { HydratedDocument } from 'mongoose';
import request from 'supertest';

import { config, CONSTS } from '../../config';
import UserModel, { UserService } from '../../Models/User';
import DubberModel from '../../Models/Dubber';
import { IM_FkUsapiAuthRefresh, IM_FkAuthorityVerify, IMock } from '../../interfaces/Mocks';
import TitleModel, { TitleService } from '../../Models/Title';
import { IFK_UsapiAuthRefresh } from '../../interfaces/http/FkUsapi';


beforeAll(() => {
  const MONGO_URI = `mongodb://${config.service.DB?.DEV.USR}:${config.service.DB?.DEV.PWD}@${config.db.HOST}:${config.db.PORT}/${config.service.DB?.DEV.DB_NAME}`;

  mongoose.set('strictQuery', false);
  mongoose.connect(MONGO_URI, {
    retryWrites: true,
  });
});

afterAll(() => {
  mongoose.disconnect();
});

const baseURL = config.URL.nekomi_core;



describe('Title Controller', () => {
  const TestID1 = 'test-controllers_title--1';
  const TestID1_username = 'testcontrollerstitleuser1';

  const TestID2 = 'test-controllers_title--2'; // Title will be deleted

  beforeAll(async () => {
    await purge();

    await TitleService.create({
      id: TestID2
    });

    const user = await UserService.create({
      id: TestID1,
      username: TestID1_username,
      avatar: 'http://example.com'
    });

    const User = new UserService({ user });
    const dubber = await DubberModel.find();

    // Add watch progress for GET /title/home_wrapped
    await User.patchWatchProgress({
      titleID: config.DATA.HomeWrapped.featured[0].id,
      dubberID: dubber[0].id,
      episodeOrder: 1,
      progress: 1,
      updatedAt: 1
    });

    await User.save();
  });

  afterAll(async () => {
    await purge();
  });

  async function purge() {
    await UserService.delete(TestID1, 'Test purge', 'many');
    await TitleService.delete(TestID2, 'Test purge', 'many');
  }

  const CSRFMock: IMock<IM_FkAuthorityVerify> = {
    id: 'FkAuthorityVerify',
    code: 200,
    data: {
      origin: CONSTS.Domains.nekomi,
      verified: true
    }
  };

  const ACMock: IMock<IM_FkUsapiAuthRefresh> = {
    id: 'FkUsapiAuthRefresh',
    code: 200,
    data: {
      avatar: '',
      capabilities: ['basic'],
      id: TestID1,
      username: TestID1_username
    }
  };

  const UsapiRefreshMock: IMock<IFK_UsapiAuthRefresh> = {
    id: 'FkUsapiAuthRefresh',
    code: 200,
    data: {
      avatar: '',
      id: TestID1,
      username: TestID1_username
    }
  };



  describe('GET /title/:id', () => {

  });

  test('GET /title/total', async () => {
    // Renewed (country = Other) must be less than total
    const { body } = await request(baseURL)
      .get('/title/total')
      .expect(200);

    expect(body.total).toBeGreaterThan(0);
    expect(body.renewed).toBeLessThanOrEqual(body.total);
  });

  describe('PATCH /title/:id', () => {

  });

  describe('DELETE /title/:id', () => {
    test('Pass - title deleted', async () => {

    });

    test('Reject - deletion key is missing', async () => {

    });

    test('Reject - access rejected', async () => {

    });
  });

  describe('GET /title/home_wrapped', () => {
    test('Pass - Titles returned from cache', async () => {
      const { body } = await request(baseURL)
        .get('/title/home_wrapped')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .expect(200);

      expect(body.featured.length).toBeGreaterThan(0);
    });

    test('Pass - Titles returned from cache with user watch progress', async () => {
      const { body } = await request(baseURL)
        .get('/title/home_wrapped')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set('Cookie', `${config.vars.sessionCookie}=_MOCKED`)
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock, UsapiRefreshMock]))
        .expect(200);

      expect(body.watchProgress[0].titleID).toBe(config.DATA.HomeWrapped.featured[0].id);
    });
  });
});