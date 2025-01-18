import User, { UserService } from '../../Models/User';
import mongoose from 'mongoose';
import { E404, ERR_ACCESS_REJECTED } from '../../Services/ErrorService';
import { INTERNALS, config } from '../../config';
import { MiddlewareService } from '../../Services/MiddlewareService';

describe('Middleware Service', () => {
  const instance = new MiddlewareService({ TestMode: true });

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
      await instance.checkAccess('_MOCKED', [], {
        id: TestID1,
        avatar: '#',
        username: '#',
        capabilities: ['root']
      });
    });

    test('Pass - Root capability present', async () => {
      await instance.checkAccess('_MOCKED', [], {
        id: TestID1,
        avatar: '#',
        username: '#',
        capabilities: ['root']
      });
    });

    test('Pass - Capabilities matched', async () => {
      await instance.checkAccess('_MOCKED', ['dubber', 'admin'], {
        id: TestID1,
        avatar: '#',
        username: '#',
        capabilities: ['dubber', 'admin']
      });
    });

    test('Reject - User is not found', async () => {
      try {
        await instance.checkAccess('_MOCKED', ['dubber', 'admin'], {
          id: '_INVALID',
          avatar: '#',
          username: '#',
          capabilities: ['dubber', 'admin']
        });
      } catch (e) {
        if (e instanceof E404) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });

    test('Reject - Capability missmatch', async () => {
      try {
        await instance.checkAccess('_MOCKED', ['dubber', 'admin'], {
          id: TestID1,
          avatar: '#',
          username: '#',
          capabilities: ['admin']
        });
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });
  });

  describe('checkCSRF', () => {
    test('Pass - No required origin', async () => {
      expect(await instance.checkCSRF('_MOCKED', [], {
        origin: config.DOMAIN.nekomi_core,
        verified: true
      })).toBeTruthy();
    });

    test('Pass - Required origin specified', async () => {
      expect(await instance.checkCSRF('_MOCKED', [config.DOMAIN.nekomi_core], {
        origin: config.DOMAIN.nekomi_core,
        verified: true
      })).toBeTruthy();
    });

    test('Reject - Token not verified', async () => {
      try {
        await instance.checkCSRF('_MOCKED', [], {
          origin: '_INVALID',
          verified: false
        });
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });

    test('Pass - Origin missmatch', async () => {
      try {
        await instance.checkCSRF('_MOCKED', [config.DOMAIN.nekomi_core], {
          origin: '_INVALID',
          verified: true
        });
      } catch (e) {
        if (e instanceof ERR_ACCESS_REJECTED) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });
  });
});