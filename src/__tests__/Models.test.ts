import mongoose from 'mongoose';
import DubberModel, { DubberService } from '../Models/Dubber';
import { config, rules } from '../config';
import { ERR_ALREADY_EXIST, ERR_LENGTH_INVALID } from '../services/ErrorService';

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



  describe('Title', () => {

  });

  describe('User', () => {

  });

  describe('Role', () => {

  });

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

    describe('patch', () => {
      describe('Change avatar', () => {
        test('Pass - Avatar changed', async () => {

        });

        test('Reject - URL invalid', async () => {

        });
      });
    });
  });
});