import ip from 'ip';
import request from 'supertest';
import mongoose from 'mongoose';
import * as cfg from '../config';

import User, { createUser } from '../Models/User';
import Title, { TitlePatcher, createTitle } from '../Models/Title';
import { ITitle, TAnimeGenre } from '../interfaces/Title';
import { IM_AccessControl, IM_CSRFCheck, IMock } from '../interfaces/Mocks';

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



describe('UserController', () => {
  /* 
    User controller tests

    * Namespaces
    * #1 - U1
    * #2 - U2
  */

  describe('#1 GET /user/:id', () => {
    /* 
      Get user by it's ID
    */

    // Mock data
    const U1_ID = `mocked-userController-1`;

    beforeAll(async () => {
      await purge();

      await createUser({
        id: U1_ID,
        username: U1_ID,
        avatar: '',
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await User.deleteMany({ id: U1_ID });
    }



    test('Pass', async () => {
      await request(baseURL)
        .get(`/user/${U1_ID}`)
        .expect(200);
    });

    test('Reject - User not found', async () => {
      await request(baseURL)
        .get('/user/_INVALID')
        .expect(404);
    });
  });

  describe('#2 PATCH /user', () => {

  });

  describe('#3 POST /user/signin', () => {

  });

  describe('#4 GET /user/logout', () => {

  });
});