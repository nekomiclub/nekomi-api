process.argv.push('testMode');

import DubberController from '~/controllers/Dubber/DubberController';
import DubberService from '~/core/Services/DubberService';
import Search from '~/services/SearchService';
import mongoose from 'mongoose';
import { HTTPErrorConstructor } from '~/services/ErrorService';
import { TitleService } from '~/Models/Title';
import { UserService } from '~/Models/User';
import { config } from '~/config';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});

afterAll(() => {
  mongoose.disconnect();
});



describe('DubberController', () => {
  const GenericDubberService = new DubberService({ TestMode: true });

  const DubberID1 = `test-dubbercontroller--1`;
  const DubberUsernameA = `testdubbercontrollera`;

  const DubberID10 = `test-dubbercontroller--10`;

  const DubberID11 = `test-dubbercontroller--11`;
  const DubberUsernameC = `testdubbercontrollerc`;

  const DubberID12 = `test-dubbercontroller--12`;
  const DubberUsernameD = `testdubbercontrollerd`;



  beforeAll(async () => {
    await purge();



    await GenericDubberService.create({
      nameEng: DubberUsernameA,
      nameUkr: DubberUsernameA,
      DEV_ID: DubberID1,
      TEST_MEMBERS: [{
        id: DubberID1,
        memberSince: 0,
        role: 'leader'
      }, {
        id: DubberID10,
        memberSince: 0,
        role: 'member'
      }],
      TEST_MEMBERS_INVITED: [DubberID1, DubberID12]
    });

    await UserService.create({
      id: DubberID1,
      username: DubberUsernameA,
      TestMode: true,
      TEST_DUBBER_TEAM_MEMBER: DubberID1
    });

    await UserService.create({
      id: DubberID11,
      username: DubberUsernameC,
      TestMode: true,
      TEST_IS_TELEGRAM_LINKED: true
    });

    await UserService.create({
      id: DubberID12,
      username: DubberUsernameD,
      TestMode: true,
      TEST_IS_TELEGRAM_LINKED: true
    });

    await TitleService.create({
      id: DubberID1,
      TEST_EPISODES: [{
        dubberID: DubberID1,
        frames: [],
        order: 1,
        qualities: {
          q1080: '',
          q240: null,
          q480: null,
          q4k: null,
          q720: null
        }
      }]
    }, true);



    await Search.update('dubber');
  });

  afterAll(async () => {
    await purge();
  });

  async function purge() {
    await GenericDubberService.deleteMany(DubberID1);
    await UserService.delete(DubberID1, 'test purge', 'many');
    await UserService.delete(DubberID11, 'test purge', 'many');
    await UserService.delete(DubberID12, 'test purge', 'many');
    await TitleService.delete(DubberID1, 'test purge', 'many');
  }



  describe('GetOneByQuery', () => {
    test(`Test details mode with others`, async () => {
      const { dubber, dubbedAnime, parsedMembers } = await DubberController.GetOneByQuery({
        query: DubberUsernameA,
        detailed: true,
        fetchDubbedAnime: true,
        parseMembers: true
      });

      expect(dubber.id).toBe(DubberID1);
      // Must be present
      expect(dubbedAnime?.some(el => el.id === DubberID1)).toBeTruthy();
      // Must parse member
      expect(parsedMembers?.some(el => el.id === DubberID1)).toBeTruthy();
    });

    test(`Test other modes without details`, async () => {
      const { dubber, dubbedAnime, parsedMembers } = await DubberController.GetOneByQuery({
        query: DubberUsernameA,
        fetchDubbedAnime: true,
        parseMembers: true
      });

      // Must be undefined in not detailed mode
      expect(dubber.members).toBeUndefined();
      // Must be undefined in not detailed mode
      expect(dubbedAnime).toBeUndefined();
      // Must be undefined in not detailed mode
      expect(parsedMembers).toBeUndefined();
    });
  });

  describe('GetSearch', () => {
    test(`Test fuzzy search`, async () => {
      // Make query a little fuzzy, replacing all l into 1
      const query = DubberUsernameA.replaceAll('l', '1');
      const { results } = await DubberController.GetSearch({ q: query });

      // At least one result must match dubber id
      expect(results.some(el => el.dubber.id === DubberID1)).toBeTruthy();
    });

    test(`Test all search`, async () => {
      const { results } = await DubberController.GetSearch({ q: '~all' });

      // Results must include at least one match
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  // describe('PutAvatar', () => {
  //   test('Pass', async () => {

  //   });

  //   test('Reject', async () => {

  //   });
  // });

  // describe('PutBanner', () => {
  //   test('Pass', async () => {

  //   });

  //   test('Reject', async () => {

  //   });
  // });

  describe('PatchSettings', () => {
    test('Pass', async () => {
      // Admin can patch
      await DubberController.PatchSettings({
        dubberId: DubberID1,
        currentUser: {
          id: '_INVALID',
          username: '',
          capabilities: ['admin']
        },
      });

      // Team leader can patch
      const { dubber } = await DubberController.PatchSettings({
        dubberId: DubberID1,
        currentUser: {
          id: DubberID1,
          username: '',
          capabilities: ['dubberEditProfile']
        },
        socialLinks: {
          instagram: 'https://instagram.com/123'
        }
      });

      expect(dubber.socials.instagram).toBe('https://instagram.com/123');
    });

    test('Reject', async () => {
      // Not member can not patch
      try {
        await DubberController.PatchSettings({
          dubberId: DubberID1,
          currentUser: {
            id: '_INVALID',
            username: '',
            capabilities: ['basic']
          },
          description: '123123'
        });
        expect(false).toBeTruthy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor && e.status === 403) return expect(true).toBeTruthy();
        expect(false).toBeTruthy();
      }

      // Not leader can not patch
      try {
        await DubberController.PatchSettings({
          dubberId: DubberID1,
          currentUser: {
            id: DubberID10,
            username: '',
            capabilities: ['dubberEditProfile']
          },
          description: '123123'
        });
        expect(false).toBeTruthy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor && e.status === 403) return expect(true).toBeTruthy();
        expect(false).toBeTruthy();
      }
    });
  });

  describe('GetInviteById', () => {
    test('Pass', async () => {
      await DubberController.GetInviteById({
        dubberId: DubberID1,
        userId: DubberID1
      });
    });

    test('Reject', async () => {
      // Member not invited
      try {
        await DubberController.GetInviteById({
          dubberId: DubberID1,
          userId: '_INVALID'
        });

        expect(false).toBeTruthy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor && e.status === 400) return expect(true).toBeTruthy();
        expect(false).toBeTruthy();
      }
    });
  });

  describe('PostInviteSend', () => {
    test('Pass', async () => {
      await DubberController.PostInviteSend({
        dubberId: DubberID1,
        userId: DubberID11,
        currentUser: {
          id: '_INVALID',
          username: '',
          capabilities: ['admin']
        }
      });
    });

    test('Reject', async () => {
      // Can not
      try {
        await DubberController.PostInviteSend({
          dubberId: DubberID1,
          userId: '122121211212',
          currentUser: {
            id: DubberID10,
            username: '',
            capabilities: ['basic']
          }
        });

        expect(false).toBeTruthy();
      } catch (e) {
        if (e instanceof HTTPErrorConstructor && e.status === 403) return expect(true).toBeTruthy();
        expect(false).toBeTruthy();
      }
    });
  });

  describe('PostInviteAccept', () => {
    test('Pass', async () => {
      await DubberController.PostInviteAccept({
        dubberId: DubberID1,
        userId: DubberID11
      });
    });
  });

  describe('PostInviteDecline', () => {
    test('Pass', async () => {
      await DubberController.PostInviteDecline({
        dubberId: DubberID1,
        userId: DubberID12
      });
    });
  });
});