import User, { UserService } from '~/models/User';
import mongoose from 'mongoose';
import { E404, ERR_ACCESS_REJECTED } from '~/services/ErrorService';
import { INTERNALS, config } from '~/config';
import { MiddlewareService } from '~/services/MiddlewareService';

describe('Middleware Service', () => {
  const instance = new MiddlewareService();

  beforeAll(() => {
    const MONGO_URI = `mongodb://${INTERNALS.database.creds!.usr}:${INTERNALS.database.creds!.pwd}@${INTERNALS.database.host}:${INTERNALS.database.port}/${INTERNALS.database.creds!.name}`;

    mongoose.set('strictQuery', false);
    mongoose.connect(MONGO_URI, {
      retryWrites: true,
    });
  });

  afterAll(() => {
    mongoose.disconnect();
  });



  describe('checkAccess', () => {
    /** Root user */
    const TestID1 = `test-services--U1`;
    const TestID1_username = 'testservicesu1';

    beforeAll(async () => {
      await purge();

      await UserService.create({
        avatar: 'http://example.com',
        username: TestID1_username,
        id: TestID1
      });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await User.deleteMany({ id: TestID1 });
    }



    test('Pass - No capability required', async () => {
      await instance.checkAccess({
        token: '_MOCKED',
        capabilities: [],
        mock: {
          id: TestID1,
          avatar: '#',
          username: '#',
          capabilities: ['root']
        }
      });
    });

    test('Pass - Root capability present', async () => {
      await instance.checkAccess({
        token: '_MOCKED',
        capabilities: [],
        mock: {
          id: TestID1,
          avatar: '#',
          username: '#',
          capabilities: ['root']
        }
      });
    });

    test('Pass - Capabilities matched', async () => {
      await instance.checkAccess({
        token: '_MOCKED',
        capabilities: ['dubber', 'admin'],
        mock: {
          id: TestID1,
          avatar: '#',
          username: '#',
          capabilities: ['dubber', 'admin']
        }
      });
    });

    test('Reject - User is not found', async () => {
      try {
        await instance.checkAccess({
          token: '_MOCKED',
          capabilities: ['dubber', 'admin'],
          mock: {
            id: '_INVALID',
            avatar: '#',
            username: '#',
            capabilities: ['dubber', 'admin']
          }
        });
      } catch (e) {
        if (e instanceof E404) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });

    test('Reject - Capability missmatch', async () => {
      try {
        await instance.checkAccess({
          token: '_MOCKED',
          capabilities: ['dubber', 'admin'],
          mock: {
            id: TestID1,
            avatar: '#',
            username: '#',
            capabilities: ['admin']
          }
        });
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });
  });

  describe('checkCSRF', () => {
    test('Pass - No required origin', async () => {
      expect(await instance.checkCSRF({
        token: '_MOCKED',
        origins: [],
        mock: {
          origin: config.DOMAIN.nekomi_core,
          verified: true
        }
      })).toBeTruthy();
    });

    test('Pass - Required origin specified', async () => {
      expect(await instance.checkCSRF({
        token: '_MOCKED',
        origins: [config.DOMAIN.nekomi_core],
        mock: {
          origin: config.DOMAIN.nekomi_core,
          verified: true
        }
      })).toBeTruthy();
    });

    test('Reject - Token not verified', async () => {
      try {
        await instance.checkCSRF({
          token: '_MOCKED',
          origins: [],
          mock: {
            origin: '_INVALID',
            verified: false
          }
        });
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });

    test('Pass - Origin missmatch', async () => {
      try {
        await instance.checkCSRF({
          token: '_MOCKED',
          origins: [config.DOMAIN.nekomi_core],
          mock: {
            origin: '_INVALID',
            verified: true
          }
        });
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });
  });
});