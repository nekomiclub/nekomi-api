process.argv.push('testMode');
process.argv.push('devMode');



import User, { UserService } from '~/models/User';
import mongoose from 'mongoose';
import { E403, E404 } from '~/services/ErrorService';
import { MiddlewareService } from '~/services/MiddlewareService';
import { config } from '~/config';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



describe('Middleware Service', () => {
  const instance = new MiddlewareService();



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
        if (e instanceof E403) return expect(true).toBeTruthy();
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
          origin: config.DOMAIN.nekomiApi,
          verified: true
        }
      })).toBeTruthy();
    });

    test('Pass - Required origin specified', async () => {
      expect(await instance.checkCSRF({
        token: '_MOCKED',
        origins: [config.DOMAIN.nekomiApi],
        mock: {
          origin: config.DOMAIN.nekomiApi,
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
        if (e instanceof E403) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });

    test('Pass - Origin missmatch', async () => {
      try {
        await instance.checkCSRF({
          token: '_MOCKED',
          origins: [config.DOMAIN.nekomiApi],
          mock: {
            origin: '_INVALID',
            verified: true
          }
        });
      } catch (e) {
        if (e instanceof E403) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });
  });
});