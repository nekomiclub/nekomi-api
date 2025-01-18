import mongoose from 'mongoose';

import { DubberService } from '../../../Models/Dubber';
import { ERR_ALREADY_EXIST, ERR_LENGTH_INVALID } from '../../../Services/ErrorService';
import { INTERNALS, config } from '../../../config';



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



describe('Dubber Service', () => {
  const TestID1 = `test-models_dubber--D1`;
  const TestID2 = `test-models_dubber--D2`;

  beforeAll(async () => {
    await purge();

    await DubberService.create({ nameEng: TestID1, id: TestID1, nameUkr: TestID1 });
    await DubberService.create({ nameEng: TestID2, id: TestID2, nameUkr: TestID2 });
  });

  afterAll(async () => {
    await purge();
  });

  async function purge() {
    await DubberService.delete(TestID1, 'Test purge');
    await DubberService.delete(TestID2, 'Test purge');
  }



  describe('create', () => {
    // Pass already tested at beforeAll callback

    test('Reject - Name or code length missmatch (Above max)', async () => {
      try {
        await DubberService.create({
          nameEng: 'X'.repeat(config.VALIDATION.CreateUser.maxNameLength + 1),
          nameUkr: 'X'.repeat(config.VALIDATION.CreateUser.maxNameLength + 1),
        });
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });

    test('Reject - Name or code length missmatch (Below min)', async () => {
      try {
        await DubberService.create({
          nameEng: 'X'.repeat(config.VALIDATION.CreateUser.minNameLength - 1),
          nameUkr: 'X'.repeat(config.VALIDATION.CreateUser.minNameLength - 1),
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
          nameEng: TestID1,
          nameUkr: TestID1
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