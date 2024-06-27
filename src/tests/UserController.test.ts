import ip from 'ip';
import request from 'supertest';
import mongoose from 'mongoose';
import * as cfg from '../config';

import User, { createUser } from '../Models/User';
import Title, { TitlePatcher, createTitle } from '../Models/Title';
import { ITitle, TAnimeGenre } from '../interfaces/Title';
import { IM_AccessControl, IM_CSRFCheck, IMock } from '../interfaces/Mocks';
import { IFK_UsapiAuthRefresh } from '../interfaces/FullkekwResponses';

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
    * #3 - U3, U31
  */

  const CSRFMock: IMock<IM_CSRFCheck> = {
    id: 'CSRFCheck',
    code: 200,
    data: {
      verified: true,
      origin: 'animee.club'
    }
  };

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
    /*
      Patch user data
  
      * Methods
      * editFolderItem - Add/delete title from folder
    */

    // Mock data
    const U2_ID = `mocked-userController-2`;

    const ACMock: IMock<IM_AccessControl> = {
      code: 200,
      id: 'AccessControl',
      data: {
        id: U2_ID,
      }
    };

    beforeAll(async () => {
      await purge();

      await createUser({
        id: U2_ID,
        username: U2_ID,
        avatar: '',
        libs: [{
          id: U2_ID,
          createdAt: 0,
          settings: {
            hidden: false,
            immortal: false,
            name: U2_ID
          },
          titles: [],
          type: 'favorite'
        }],

        test: true
      });

      await createTitle('ROOT_TESTING', {
        id: U2_ID
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await User.deleteMany({ id: U2_ID });
      await Title.deleteMany({ id: U2_ID });
    }

    test('Reject - Method invalid', async () => {
      await request(baseURL)
        .patch('/user')
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
        .send({
          method: '_INVALID'
        })
        .expect(400);
    });

    test('Reject - CSRF Missmatch', async () => {
      const CSRFMock: IMock<IM_CSRFCheck> = {
        id: 'CSRFCheck',
        code: 200,
        data: {
          verified: false,
          origin: 'animee.club'
        }
      };

      await request(baseURL)
        .patch('/user')
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
        .send({
          method: 'editFolderItem'
        })
        .expect(403);
    });


    describe('editFolderItem', () => {
      test('Pass - Title added', async () => {
        await request(baseURL)
          .patch('/user')
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
          .send({
            method: 'editFolderItem',
            titleId: U2_ID,
            folderId: U2_ID
          })
          .expect(200);

        const user = await User.findOne({ id: U2_ID });

        const lib = user?.libs.find(el => el.id === U2_ID);

        expect(lib?.titles.includes(U2_ID)).toBeTruthy();
      });

      test('Pass - Title deleted', async () => {
        await request(baseURL)
          .patch('/user')
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
          .send({
            method: 'editFolderItem',
            titleId: U2_ID,
            folderId: U2_ID
          })
          .expect(200);

        const user = await User.findOne({ id: U2_ID });

        const lib = user?.libs.find(el => el.id === U2_ID);

        expect(lib?.titles.includes(U2_ID)).toBeFalsy();
      });

      test('Reject - Invalid payload', async () => {
        await request(baseURL)
          .patch('/user')
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
          .send({
            method: 'editFolderItem',
          })
          .expect(400);
      });

      test('Reject - Title undefined', async () => {
        await request(baseURL)
          .patch('/user')
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
          .send({
            method: 'editFolderItem',
            titleId: '_INVALID',
            folderId: U2_ID
          })
          .expect(404);
      });

      test('Reject - Folder undefined', async () => {
        await request(baseURL)
          .patch('/user')
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
          .send({
            method: 'editFolderItem',
            titleId: U2_ID,
            folderId: '_INVALID'
          })
          .expect(404);
      });
    });

    describe('increaseViewtime', () => {
      test('Pass', async () => {
        await request(baseURL)
          .patch('/user')
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
          .send({
            method: 'increaseViewtime',
            viewtime: 120
          })
          .expect(200);

        const user = await User.findOne({ id: U2_ID });

        expect(user?.statistics.timeSpent).toBe(2);
      });

      test('Reject - viewtime is NaN', async () => {
        await request(baseURL)
          .patch('/user')
          .set('Authorization', '_MOCKED')
          .set(config.vars.csrfHeader, '_MOCKED')
          .set(config.vars.mockHeader, JSON.stringify([CSRFMock, ACMock]))
          .send({
            method: 'increaseViewtime',
            viewtime: '120f'
          })
          .expect(400);
      });
    });
  });

  describe('#3 POST /user/signin', () => {
    /** 
     * Set session cookie
     */

    // Mock data
    const U3_ID = `mocked-userController-3`; // Exist user
    const U31_ID = `mocked-userController-31`; // Not exist user

    beforeAll(async () => {
      await purge();

      await createUser({
        id: U3_ID,
        username: U3_ID,
        avatar: '',
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await User.deleteMany({ id: U3_ID });
      await User.deleteMany({ id: U31_ID });
    }



    test('U3 Pass - User exist & username modified', async () => {
      const AxiosMock: IMock<IFK_UsapiAuthRefresh> = {
        code: 200,
        id: 'UserSignin',
        data: {
          avatar: 'NEW_AVATAR',
          id: U3_ID,
          msg: 'ok',
          username: 'NEW_USERNAME'
        }
      };

      const res = await request(baseURL)
        .post('/user/signin')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock, AxiosMock]))
        .send({
          session: '_MOCKED'
        })
        .expect(200);

      const user = await User.findOne({ id: U3_ID });

      expect(user?.username).toBe('NEW_USERNAME'); // Change username to actual
      expect(user?.avatar).toBe('NEW_AVATAR'); // Change avatar URL to actual
    });

    test('U31 Pass - User created', async () => {
      const AxiosMock: IMock<IFK_UsapiAuthRefresh> = {
        code: 200,
        id: 'UserSignin',
        data: {
          avatar: 'avatar',
          id: U31_ID,
          msg: 'ok',
          username: 'U31_USERNAME'
        }
      };

      await request(baseURL)
        .post('/user/signin')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock, AxiosMock]))
        .send({
          session: '_MOCKED'
        })
        .expect(200);

      const user = await User.findOne({ id: U31_ID });

      expect(user).toBeTruthy(); // User should be created
      expect(user?.username === 'U31_USERNAME').toBeTruthy(); // User should specified username
    });

    test('Reject - CSRF missmatch', async () => {
      const CSRFMock: IMock<IM_CSRFCheck> = {
        id: 'CSRFCheck',
        code: 200,
        data: {
          verified: false,
          origin: 'animee.club'
        }
      };

      // Copy of one of passed tests

      const AxiosMock: IMock<IFK_UsapiAuthRefresh> = {
        code: 200,
        id: 'UserSignin',
        data: {
          avatar: 'NEW_AVATAR',
          id: U3_ID,
          msg: 'ok',
          username: 'NEW_USERNAME'
        }
      };

      await request(baseURL)
        .post('/user/signin')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock, AxiosMock]))
        .send({
          session: '_MOCKED'
        })
        .expect(403);
    });
  });

  describe('#4 GET /user/logout', () => {
    /**
     * Remove session cookie
     */

    const CSRFMock: IMock<IM_CSRFCheck> = {
      id: 'CSRFCheck',
      code: 200,
      data: {
        verified: true,
        origin: 'animee.club'
      }
    };

    test('Pass', async () => {
      await request(baseURL)
        .get('/user/logout')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .set('Cookie', [
          `${config.vars.sessionCookie}=COOKIE`
        ])
        .expect(200);
    });

    test('Reject - CSRF missmatch', async () => {
      const CSRFMock: IMock<IM_CSRFCheck> = {
        id: 'CSRFCheck',
        code: 200,
        data: {
          verified: false,
          origin: 'animee.club'
        }
      };

      // Copy of one of passed tests

      await request(baseURL)
        .get('/user/logout')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([CSRFMock]))
        .set('Cookie', [
          `${config.vars.sessionCookie}=COOKIE`
        ])
        .expect(403);
    });
  });
});