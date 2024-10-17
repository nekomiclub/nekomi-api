import mongoose from 'mongoose';
import { config } from '../config';
import { E404, ERR_ACCESS_REJECTED, HTTPErrorConstructor } from '../services/ErrorService';
import { MiddlewareService } from '../services/MiddlewareService';
import { singCSRFToken } from '../services/TokenService';
import User, { UserModel, UserService } from './models/User';

describe('Middleware Service', () => {
  const instance = new MiddlewareService({ testMode: true });

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



  describe('checkAccess', () => {
    /** Root user */
    const TestID1 = `test-services--U1`;

    beforeAll(async () => {
      await purge();

      await UserService.create({
        avatar: '#',
        username: TestID1,
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
        origin: config.vars.domain,
        verified: true
      })).toBeTruthy();
    });

    test('Pass - Required origin specified', async () => {
      expect(await instance.checkCSRF('_MOCKED', [config.vars.domain], {
        origin: config.vars.domain,
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
        await instance.checkCSRF('_MOCKED', [config.vars.domain], {
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