import ip from 'ip';
import request from 'supertest';
import { app } from '..';
import { IMockedData, config } from '../config';
import mongoose from 'mongoose';
import User, { createUser } from '../Models/User';
import Title, { createTitle } from '../Models/Title';

const baseURL = `http://${ip.address()}`;

describe('TitleController', () => {
  /*
    Title controller tests

    * Namespaces
    * #1 - T1
    * #2 - T2
    * #3 - T3
  */

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



  describe('#1 GET /title/:query', () => {
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

  describe('#2 DELETE /title/:query', () => {
    /*
      * Delete title by ID
      * Required perms - titleDelete
      * Required CSRF - animee.club
    */

    // Mock data
    const T2_ID = 'mocked-titleController-2';

    beforeAll(async () => {
      await purge();

      await createTitle('ROOT_TESTING', {
        id: T2_ID,
      });

      await createUser({
        id: T2_ID,
        roles: ['user', 'editor']
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await Title.deleteMany({ id: T2_ID });

      await User.deleteMany({ id: T2_ID });
    }



    test('T2 Pass - Deleted', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'ac_1',
          code: 200,
          data: {
            id: T2_ID,
          }
        },
        {
          id: 'csrf_1',
          code: 200,
          data: {
            verified: true,
            origin: 'animee.club'
          }
        }
      ];

      await request(baseURL)
        .delete(`/title/${T2_ID}`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(200);
    });

    test('T2 Reject - Not found', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'ac_1',
          code: 200,
          data: {
            id: T2_ID,
          }
        },
        {
          id: 'csrf_1',
          code: 200,
          data: {
            verified: true,
            origin: 'animee.club'
          }
        }
      ];

      await request(baseURL)
        .delete(`/title/_INVALID`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(404);
    });

    test('T2 Reject - Perm missmatch', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'ac_1',
          code: 200,
          data: {
            id: T2_ID,
            capabilities: ['root']
          }
        },
        {
          id: 'csrf_1',
          code: 200,
          data: {
            verified: true,
            origin: 'animee.club'
          }
        }
      ];

      await request(baseURL)
        .delete(`/title/_INVALID`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(403);
    });

    test('T2 Reject - CSRF missmatch', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'ac_1',
          code: 200,
          data: {
            id: T2_ID,
          }
        },
        {
          id: 'csrf_1',
          code: 200,
          data: {
            verified: true,
            origin: '_INVALID'
          }
        }
      ];

      await request(baseURL)
        .delete(`/title/_INVALID`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(403);
    });
  });

  describe('#3 POST /title', () => {
    /*
      * Create title
    */

    // Mock data
    const T3_ID = 'mocked-titleController-3';

    beforeAll(async () => {
      await purge();

      await createUser({
        id: T3_ID,
        roles: ['user', 'editor']
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await User.deleteMany({ id: T3_ID });
      await Title.deleteMany({ id: T3_ID });
    }



    test('T3 Pass - Title created', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'ac_1',
          code: 200,
          data: {
            id: T3_ID,
          }
        },
        {
          id: 'csrf_1',
          code: 200,
          data: {
            verified: true,
            origin: 'animee.club'
          }
        }
      ];

      await request(baseURL)
        .post(`/title`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(201);
    });

    test('T3 Reject - Perm missmatch', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'ac_1',
          code: 200,
          data: {
            id: T3_ID,
            capabilities: ['root']
          }
        },
        {
          id: 'csrf_1',
          code: 200,
          data: {
            verified: true,
            origin: 'animee.club'
          }
        }
      ];

      await request(baseURL)
        .post(`/title`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(403);
    });

    test('T3 Reject - CSRF missmatch', async () => {
      const mockedData: IMockedData[] = [
        {
          id: 'ac_1',
          code: 200,
          data: {
            id: T3_ID,
          }
        },
        {
          id: 'csrf_1',
          code: 200,
          data: {
            verified: true,
            origin: '_INVALID'
          }
        }
      ];

      await request(baseURL)
        .post(`/title`)
        .set('Authorization', '_MOCKED')
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify(mockedData))
        .expect(403);
    });
  });
});