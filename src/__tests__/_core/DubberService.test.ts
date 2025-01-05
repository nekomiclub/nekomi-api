import DubberModel from '../../_core/models/DubberModel';
import DubberService from '../../_core/services/DubberService';
import mongoose from 'mongoose';
import { HTTPErrorConstructor } from '../../services/ErrorService';
import { config } from '../../config';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});

afterAll(() => {
  mongoose.disconnect();
});



describe('DubberService', () => {
  const TestId1 = 'dubber-testid--1';
  const TestSlugA = 'dubber-testslug-a';

  const TestId2 = 'dubber-testid--2';

  const dubberService = new DubberService({
    testMode: true
  });

  beforeAll(async () => {
    await dubberService.create({
      nameEng: 'fsdfsdsfddsf',
      nameUkr: 'r2r2fsdds',
      DEV_ID: TestId2
    });

    await purge();
  });

  afterAll(async () => {
    await purge();
  });

  async function purge() {
    DubberModel.deleteMany({ id: TestId1 });
  }



  describe('DubberCRUD', () => {
    test('Create', async () => {
      //* Create new dubber
      const createdDubber = await dubberService.create({
        nameEng: '  dubber    testslug a  ',
        nameUkr: 'hello1233',
        DEV_ID: TestId1
      });

      expect(createdDubber.nameEng).toBe(TestSlugA.replaceAll('-', ' '));
      expect(createdDubber.slug).toBe(TestSlugA);
      // @ts-expect-error Property provided by mongodb must be excluded by DTO
      expect(createdDubber._id).toBeUndefined();

      //* ERR_NOT_LATIN
      try {
        await dubberService.create({
          nameEng: '  1221f fsdsfds    fd',
          nameUkr: 'hello121'
        });

        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:name_not_latin');
        }
      }

      //* ERR_NAME_LENGTH_INVALID
      try {
        await dubberService.create({
          nameEng: 'X'.repeat(config.VALIDATION.CreateUser.maxNameLength + 10),
          nameUkr: 'hello1212'
        });

        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:name_length_invalid');
        }
      }
    });

    test('Read', async () => {
      //* Get exist dubber
      const getDubberById = await dubberService.getById(TestId1);
      expect(getDubberById).toBeTruthy();

      const getDubberByQuery = await dubberService.getByQuery(TestSlugA);
      expect(getDubberByQuery).toBeTruthy();

      const getAll = await dubberService.getAll();
      expect(getAll.length).toBeGreaterThan(0);

      //* Get not exist dubber
      try {
        await dubberService.getById('_INVALID');
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.status).toBe(404);
        }
      }
    });

    test('Delete', async () => {
      //* Delete dubber
      await dubberService.deleteOne(TestId1);

      //* Ensure that dubber deleted
      try {
        await dubberService.getById(TestId1);
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.status).toBe(404);
        }
      }
    });
  });

  describe('Patching', () => {
    const patchService = new DubberService({
      testMode: true
    });

    beforeAll(async () => {
      await patchService.init(TestId2);
    });

    test('patchNames', async () => {
      await patchService.changeName({
        nameEng: 'hello    out  wrld  ',
        nameUkr: 'idklsaad  1  '
      });

      expect(patchService.dubber.nameUkr).toBe('idklsaad 1');
      expect(patchService.dubber.nameEng).toBe('hello out wrld');
      expect(patchService.dubber.slug).toBe('hello-out-wrld');

      //* ERR_NAME_LENGTH_INVALID
      try {
        await patchService.changeName({
          nameEng: 'X'.repeat(config.VALIDATION.CreateUser.maxNameLength + 10),
          nameUkr: 'hello1212'
        });

        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:name_length_invalid');
        }
      }
    });

    test('patchDescription', async () => {
      await patchService.changeDescription('new description');
      expect(patchService.dubber.description).toBe('new description');

      await patchService.changeDescription('');
      expect(patchService.dubber.description).toBe(null);

      await patchService.changeDescription(null);
      expect(patchService.dubber.description).toBe(null);

      //* ERR_DESCRIPTION_LENGTH_INVALID
      try {
        await patchService.changeDescription('X'.repeat(config.VALIDATION.PatchTitle.maxDescriptionLength + 10));

        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:description_length_invalid');
        }
      }
    });

    test('patchSocials', async () => {
      await patchService.changeSocials({ key: 'instagram', value: 'https://instagram.com/idk' });
      expect(patchService.dubber.socials.instagram).toBe('https://instagram.com/idk');

      await patchService.changeSocials({ key: 'instagram', value: '' });
      expect(patchService.dubber.socials.instagram).toBe(null);

      await patchService.changeSocials({ key: 'instagram', value: null });
      expect(patchService.dubber.socials.instagram).toBe(null);

      //* ERR_LINK_DOMAIN_MISSMATCH
      try {
        await patchService.changeSocials({ key: 'instagram', value: 'https://NOT.INSTAGRAM.com/idk' });

        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:link_domain_missmatch');
        }
      }
    });

    test('patchSupport', async () => {
      await patchService.changeSupport({ key: 'monobank', value: 'https://send.monobank.ua/idk' });
      expect(patchService.dubber.support.monobank).toBe('https://send.monobank.ua/idk');

      await patchService.changeSupport({ key: 'monobank', value: '' });
      expect(patchService.dubber.support.monobank).toBe(null);

      await patchService.changeSupport({ key: 'monobank', value: null });
      expect(patchService.dubber.support.monobank).toBe(null);

      //* ERR_LINK_DOMAIN_MISSMATCH
      try {
        await patchService.changeSupport({ key: 'monobank', value: 'https://NOT.SEND.monobank.ua/idk' });

        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:link_domain_missmatch');
        }
      }
    });
  });
});