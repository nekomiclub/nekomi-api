import ip from 'ip';
import request from 'supertest';
import { config } from '../config';
import mongoose from 'mongoose';
import User, { createUser } from '../Models/User';
import { IM_AccessControl, IM_CSRFCheck, IMock } from '../interfaces/Mocks';

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



describe('DevController', () => {
  //* This controller works only in Development mode

  // Routes
  const getAccessControl = `/dev/AccessControl`;
  const getCSRFCheck = `/dev/CSRFCheck`;



  describe(getAccessControl, () => {
    /*
      * Route checks AccessControl middleware
      * Route requires "dubber" user capability 
    */

    // Mock data
    const U1_ID = 'mocked-devController_U1';
    const U2_ID = 'mocked-devController_U2';

    beforeAll(async () => {
      await purge();

      await createUser({
        id: U1_ID,
        roles: ['user', 'dubber'],
        username: U1_ID,
        avatar: ''
      });

      await createUser({
        id: U2_ID,
        roles: ['user', 'root'],
        username: U2_ID,
        avatar: ''
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await User.deleteMany({ id: U1_ID });
      await User.deleteMany({ id: U2_ID });
    }



    test('U1 Pass - Empty array', async () => {
      // Capabilities mocked

      const mockedData: IMock<IM_AccessControl> = {
        id: 'AccessControl',
        code: 200,
        data: {
          id: U1_ID,
          capabilities: []
        }
      };

      await request(baseURL)
        .get(getAccessControl)
        .set('Authorization', 'dummy')
        .set(config.vars.mockHeader, JSON.stringify([mockedData]))
        .expect(200);
    });

    test('U1 Pass - Capabilities matched', async () => {
      const mockedData: IMock<IM_AccessControl> = {
        id: 'AccessControl',
        code: 200,
        data: {
          id: U1_ID
        }
      };

      await request(baseURL)
        .get(getAccessControl)
        .set('Authorization', 'dummy')
        .set(config.vars.mockHeader, JSON.stringify([mockedData]))
        .expect(200);
    });

    test('U2 Pass - Root role', async () => {
      const mockedData: IMock<IM_AccessControl> = {
        id: 'AccessControl',
        code: 200,
        data: {
          id: U2_ID
        }
      };

      await request(baseURL)
        .get(getAccessControl)
        .set('Authorization', 'dummy')
        .set(config.vars.mockHeader, JSON.stringify([mockedData]))
        .expect(200);
    });



    test('Reject - No authorization', async () => {
      await request(baseURL)
        .get(getAccessControl)
        .set('Authorization', '')
        .expect(401);
    });

    test('U1 Reject - Capabilities missmatch', async () => {
      const mockedData: IMock<IM_AccessControl> = {
        id: 'AccessControl',
        code: 200,
        data: {
          id: U1_ID,
          capabilities: ['root']
        }
      };

      await request(baseURL)
        .get(getAccessControl)
        .set('Authorization', 'dummy')
        .set(config.vars.mockHeader, JSON.stringify([mockedData]))
        .expect(403);
    });
  });

  describe(getCSRFCheck, () => {
    /*
      * Route checks CSRFCheck middleware
      * Route pass only api.animee.club domain
    */

    test('Pass', async () => {
      const mockedData: IMock<IM_CSRFCheck> = {
        id: 'CSRFCheck',
        code: 200,
        data: {
          verified: true,
          origin: config.vars.domain
        }
      };

      await request(baseURL)
        .get(getCSRFCheck)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([mockedData]))
        .expect(200);
    });

    test('Reject - Token undefined', async () => {
      await request(baseURL)
        .get(getCSRFCheck)
        .set(config.vars.csrfHeader, '')
        .expect(401);
    });

    test('Reject - Token invalid', async () => {
      // Reject due to not verified token

      const mockedData: IMock<IM_CSRFCheck> = {
        id: 'CSRFCheck',
        code: 200,
        data: {
          verified: false,
          origin: config.vars.domain
        }
      };

      await request(baseURL)
        .get(getCSRFCheck)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([mockedData]))
        .expect(403);
    });

    test('Reject - Token missmatch', async () => {
      // Reject due to origin missmatch (expect - api.animee.club)

      const mockedData: IMock<IM_CSRFCheck> = {
        id: 'CSRFCheck',
        code: 200,
        data: {
          verified: true,
          origin: '_INVALID'
        }
      };

      await request(baseURL)
        .get(getCSRFCheck)
        .set(config.vars.csrfHeader, '_MOCKED')
        .set(config.vars.mockHeader, JSON.stringify([mockedData]))
        .expect(403);
    });
  });
});