import mongoose from 'mongoose';
import DubberModel, { DubberService } from '../Models/Dubber';
import { config, rules } from '../config';
import { ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID } from '../services/ErrorService';
import { UserService } from '../Models/User';

describe('Models test', () => {
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



  // describe('Title', () => {

  // });

  describe('User', () => {
    const TestID1 = `test-models--U1`;
    const TestUS1 = `testusername`;

    beforeAll(async () => {
      await purge();

      await UserService.create({ id: TestID1, username: TestUS1 });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await UserService.delete(TestID1, 'Test purge');
    }

    describe('create', () => {
      // Pass already tested at beforeAll callback

      test('Reject - Username must be Alpha and be in length range', async () => {
        try {
          await UserService.create({
            id: TestID1,
            username: 'fsdsdff 32fgsd  sdfsd2- =#$+',
          });

          expect(false).toBeTruthy(); // Invalid error type or error does not thrown
        } catch (e) {
          if (e instanceof ERR_INVALID_PAYLOAD) expect(true).toBeTruthy();
        }

        try {
          await UserService.create({
            id: TestID1,
            username: '#'.repeat(rules.CreateUser.maxNameLength + 1),
          });

          expect(false).toBeTruthy(); // Invalid error type or error does not thrown
        } catch (e) {
          if (e instanceof ERR_LENGTH_INVALID) expect(true).toBeTruthy();
        }
      });

      test('Reject - Avatar must be URL', async () => {
        try {
          await UserService.create({
            id: TestID1,
            username: TestUS1,
            avatar: 'fsdffsdfdsfdssdfd'
          });
        } catch (e) {
          if (e instanceof ERR_INVALID_PAYLOAD) return expect(true).toBeTruthy();
        }

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      });

      test('Reject - User already exist', async () => {
        try {
          await UserService.create({
            id: TestID1,
            username: TestUS1,
          });
        } catch (e) {
          if (e instanceof ERR_ALREADY_EXIST) return expect(true).toBeTruthy();
        }

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      });
    });

    test('delete', async () => {
      await UserService.delete(TestID1, 'Test delete');

      expect(true).toBeTruthy();
    });

    describe('patch', () => {

    });
  });

  // describe('Role', () => {

  // });

  describe('Dubber', () => {
    const TestID1 = `test-models--D1`;

    beforeAll(async () => {
      await purge();

      await DubberService.create({ name: TestID1, code: TestID1, id: TestID1 });
    });

    afterAll(async () => {
      await purge();
    });

    async function purge() {
      await DubberService.delete(TestID1, 'Test purge');
    }



    describe('create', () => {
      // Pass already tested at beforeAll callback

      test('Reject - Name or code length missmatch (Above max)', async () => {
        try {
          await DubberService.create({
            code: 'X'.repeat(rules.CreateUser.maxNameLength + 1),
            name: 'X'.repeat(rules.CreateUser.maxNameLength + 1),
          });
        } catch (e) {
          if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();
        }

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      });

      test('Reject - Name or code length missmatch (Below min)', async () => {
        try {
          await DubberService.create({
            code: 'X'.repeat(rules.CreateUser.minNameLength - 1),
            name: 'X'.repeat(rules.CreateUser.minNameLength - 1),
          });
        } catch (e) {
          if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();
        }

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      });


      test('Reject - Already exist', async () => {
        try {
          await DubberService.create({
            id: TestID1,
            code: TestID1,
            name: TestID1,
          });
        } catch (e) {
          if (e instanceof ERR_ALREADY_EXIST) return expect(true).toBeTruthy();
        }

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      });
    });

    test('delete', async () => {
      await DubberService.delete(TestID1, 'Test delete');

      expect(true).toBeTruthy();
    });

    // describe('patch', () => {
    //   describe('Change avatar', () => {
    //     test('Pass - Avatar changed', async () => {

    //     });

    //     test('Reject - URL invalid', async () => {

    //     });
    //   });
    // });
  });
});