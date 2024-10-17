import mongoose from 'mongoose';

import { config, RULES } from '../../../config';
import { DubberService } from '../../../Models/Dubber';
import { ERR_ALREADY_EXIST, ERR_LENGTH_INVALID } from '../../../services/ErrorService';



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



describe('Dubber Service', () => {
  const TestID1 = `test-models_dubber--D1`;

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
          code: 'X'.repeat(RULES.CreateUser.maxNameLength + 1),
          name: 'X'.repeat(RULES.CreateUser.maxNameLength + 1),
        });
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });

    test('Reject - Name or code length missmatch (Below min)', async () => {
      try {
        await DubberService.create({
          code: 'X'.repeat(RULES.CreateUser.minNameLength - 1),
          name: 'X'.repeat(RULES.CreateUser.minNameLength - 1),
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

  //* Patch
});