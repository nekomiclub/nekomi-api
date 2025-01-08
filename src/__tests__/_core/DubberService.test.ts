import DubberService from '../../_core/services/DubberService';
import UserModel, { UserService } from '../../Models/User';
import mongoose from 'mongoose';
import { HTTPErrorConstructor } from '../../services/ErrorService';
import { NotifyService } from '../../services/NotifyService';
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
  // CRUD
  const CrudId1 = `dubber-testcrud--1`;
  const CrudSlug1 = `dubber-testslug-a`;

  // Patching
  const PatchId1 = `dubber-testpatch--1`;

  // Members
  const MemberId1 = `dubber-testmember--1`;



  const dubberService = new DubberService({
    testMode: true
  });

  beforeAll(async () => {
    await purge();

    await dubberService.create({
      nameEng: 'fsdfsdsfddsf',
      nameUkr: 'r2r2fsdds',
      DEV_ID: PatchId1
    });

    await dubberService.create({
      nameEng: 'sdfssergfsd',
      nameUkr: 'fsdfsdf2343',
      DEV_ID: MemberId1
    });

    await UserService.create({
      id: MemberId1,
      username: 'fsdsdfsdfsdfsdf',
      TestMode: true,
      TEST_IS_TELEGRAM_LINKED: true
    });
  });

  afterAll(async () => {
    await purge();
  });

  async function purge() {
    await dubberService.deleteMany(CrudId1);
    await dubberService.deleteMany(PatchId1);
    await dubberService.deleteMany(MemberId1);
    await UserService.delete(MemberId1);
  }



  describe('DubberCRUD', () => {
    test('Create', async () => {
      //* Create new dubber
      const createdDubber = await dubberService.create({
        nameEng: '  dubber    testslug a  ',
        nameUkr: 'hello1233',
        DEV_ID: CrudId1
      });

      expect(createdDubber.nameEng).toBe(CrudSlug1.replaceAll('-', ' '));
      expect(createdDubber.slug).toBe(CrudSlug1);
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
      const getDubberById = await dubberService.getById(CrudId1);
      expect(getDubberById).toBeTruthy();

      const getDubberByQuery = await dubberService.getByQuery(CrudSlug1);
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
      await dubberService.deleteOne(CrudId1);

      //* Ensure that dubber deleted
      try {
        await dubberService.getById(CrudId1);
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
      await patchService.init(PatchId1);
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

  describe('Members', () => {
    const dubberService = new DubberService({
      testMode: true
    });

    beforeAll(async () => {
      await dubberService.init(MemberId1);
    });

    test('Invite', async () => {
      await dubberService.memberInvite({ id: MemberId1 });

      const user = await UserModel.findOne({ id: MemberId1 });

      // Check if user added to members invited
      expect(dubberService.dubber.membersInvited.includes(MemberId1)).toBeTruthy();

      // Check if subscribe added
      expect(user?.subscribes.includes(NotifyService.createEvent({ event: 'dubber_invite_pending', key: MemberId1 })));
    });

    test('Accept invite (memberAdd)', async () => {
      await dubberService.memberAdd({ id: MemberId1 });

      const user = await UserModel.findOne({ id: MemberId1 });

      // Dubber team member must be saved in stats
      expect(user?.statistics.dubber_team_member).toBe(MemberId1);

      // Role must be added
      expect(user?.roles.includes('dubber_member')).toBeTruthy();

      // Invite must be removed
      expect(dubberService.dubber.membersInvited.includes(MemberId1)).toBeFalsy();

      // User must be added as member
      expect(dubberService.dubber.members.some(el => el.id === MemberId1)).toBeTruthy();
    });

    test('Edit', async () => {
      await dubberService.memberEdit({ id: MemberId1, role: 'leader' });

      const user = await UserModel.findOne({ id: MemberId1 });

      // Role must be appended to user
      expect(user?.roles.includes('dubber_leader')).toBeTruthy();

      // Role must be appended in members list
      expect(dubberService.dubber.members.find(el => el.id === MemberId1)?.role).toBe('leader');



      //* ERR_NAME_LENGTH_INVALID
      try {


        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:name_length_invalid');
        }
      }
    });

    test('Exclude member', async () => {
      await dubberService.memberDelete({ id: MemberId1, declineInvite: false });

      const user = await UserModel.findOne({ id: MemberId1 });

      // Dubber team member must be null
      expect(user?.statistics.dubber_team_member).toBeNull();

      // Role must be removed
      expect(user?.roles.includes('dubber_leader')).toBeFalsy();

      // User must be excluded from members list
      expect(dubberService.dubber.members.some(el => el.id === MemberId1)).toBeFalsy();



      //* ERR_NAME_LENGTH_INVALID
      try {


        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:name_length_invalid');
        }
      }

      //* ERR_NAME_LENGTH_INVALID
      try {


        expect(true).toBeFalsy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          expect(e.code).toBe('dubber:name_length_invalid');
        }
      }
    });
  });
});