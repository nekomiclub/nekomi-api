import ip from 'ip';
import request from 'supertest';
import { app } from '..';
import { IMockedData, config } from '../config';
import mongoose from 'mongoose';
import User, { createUser } from '../Models/User';
import Title, { createTitle } from '../Models/Title';

const baseURL = `http://${ip.address()}`;

describe('TitleController', () => {
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



  describe('/title/:query', () => {
    /*
      * Get title by ID or code
    */

    // Mock data
    const T1_ID = 'mocked-titleController-1';
    const T1_CODE = 'mocked-titleController-1_code';

    beforeAll(async () => {
      await purge();

      await createTitle('ROOT_TESTING', {
        id: T1_ID,
        code: T1_CODE
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await Title.deleteMany({ id: T1_ID });
    }

    test('T1 Pass - Get by ID', async () => {
      await request(baseURL)
        .get(`/title/${T1_ID}`)
        .expect(200);
    });

    test('T1 Pass - Get by code', async () => {
      await request(baseURL)
        .get(`/title/${T1_CODE}`)
        .expect(200);
    });

    test('Reject - Not found', async () => {
      await request(baseURL)
        .get(`/title/dummy_not_be_founded`)
        .expect(404);
    });
  });
});