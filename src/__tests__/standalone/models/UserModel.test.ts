import mongoose from 'mongoose';

import { DubberService } from '../../../Models/Dubber';
import { E404, ERR_ALREADY_EXIST, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID } from '../../../services/ErrorService';
import { INTERNALS, config } from '../../../config';
import { TNotifyEvent } from '../../../interfaces/services/Notify';
import { TitleService } from '../../../Models/Title';
import { UserService } from '../../../Models/User';



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



describe('User Model', () => {
  let User: UserService;

  const TestTitleID1 = `test-models_user--T1`;
  const TestDubberID1 = `test-models_user--D1`;

  const TestID1 = `test-models_user--U1`;
  const TestUS1 = `testusername1`;

  const TestID2 = `test-models_user--U2`;
  const TestUS2 = `testusername2`;

  beforeAll(async () => {
    await purge();

    const user = await UserService.create({ id: TestID1, username: TestUS1 });
    User = new UserService({ user });

    await UserService.create({ id: TestID2, username: TestUS2 });
    await DubberService.create({ name: TestDubberID1, id: TestDubberID1, code: TestDubberID1 });
    await TitleService.create({
      id: TestTitleID1
    }, true);
  });

  afterAll(async () => {
    await purge();
  });

  async function purge() {
    await UserService.delete(TestID1, 'Test purge', 'many');
    await UserService.delete(TestID2, 'Test purge', 'many');

    await DubberService.delete(TestDubberID1, 'Test purge', 'many');
    await TitleService.delete(TestTitleID1, 'Test purge', 'many');
  }

  describe('create', () => {
    // Pass already tested at beforeAll callback

    test('Reject - Username must be Alphanumeric and be in length range', async () => {
      try {
        await UserService.create({
          id: TestID1,
          username: 'fsdsdff 32fgsd  sdfsd2- =#$+',
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_INVALID_PAYLOAD) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      try {
        await UserService.create({
          id: TestID1,
          username: 'X'.repeat(config.VALIDATION.CreateUser.maxNameLength + 1),
        });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
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

  // Delete already tested in purge function

  //* Patch

  describe('patchAvatar', () => {
    test('Pass - Avatar changed', async () => {
      const url = `https://${config.DOMAIN.nekomi_media}/123`;
      await User.patchAvatar({ url });

      expect(User.user.avatar).toBe(url);
    });

    test('Reject - URL invalid', async () => {
      try {
        await User.patchAvatar({ url: `media. fsdfsdf.club/` });
      } catch (e) {
        if (e instanceof ERR_INVALID_PAYLOAD) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });
  });

  describe('patchUsername', () => {
    test('Pass - Username changed', async () => {
      const username = `hellowrodl1232`;
      await User.patchUsername({ username });

      expect(User.user.username).toBe(username);
    });

    test('Reject - Username must be Alphanumeric and be in length range', async () => {
      try {
        await User.patchUsername({ username: 'fsdsdff 32fgsd  sdfsd2- =#$+' });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_INVALID_PAYLOAD) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      try {
        await User.patchUsername({ username: 'X'.repeat(config.VALIDATION.CreateUser.maxNameLength + 1) });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_LENGTH_INVALID) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });

    test('Reject - User already exist', async () => {
      try {
        await User.patchUsername({ username: TestUS2 });
      } catch (e) {
        if (e instanceof ERR_ALREADY_EXIST) return expect(true).toBeTruthy();
      }

      expect(false).toBeTruthy(); // Invalid error type or error does not thrown
    });
  });

  test('patchTelegramLinkToken', async () => {
    const token = `hfih329ue9h9qwh9hfqu9hwuhiuo`;
    await User.patchTelegramLinkToken({ token });

    expect(User.user.telegramLinkToken).toBe(token);
  });

  describe('patchStatistics', () => {
    test('Pass - isTelegramLinked', async () => {
      const isTelegramLinked = true;
      await User.patchStatistics({ isTelegramLinked });

      expect(User.user.statistics.isTelegramLinked).toBe(isTelegramLinked);
    });

    test('Pass - viewtime', async () => {
      const viewtime = 30;
      await User.patchStatistics({ viewtime });

      expect(User.user.statistics.viewtime).toBeGreaterThanOrEqual(viewtime);
    });

    test('Reject - viewtime - Invalid range', async () => {
      try {
        // Viewtime can not be less than 0
        await User.patchStatistics({ viewtime: -1 });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_INVALID_PAYLOAD) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      try {
        // Viewtime can not be larger than 2h
        await User.patchStatistics({ viewtime: 432942830423 });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof ERR_INVALID_PAYLOAD) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchWatchProgress', () => {
    test('Pass - Create and patch exist', async () => {
      expect(User.user.watchProgress.some(el => el.dubberID === TestDubberID1 && el.titleID === TestTitleID1)).toBeFalsy();

      // Add new record
      await User.patchWatchProgress({ dubberID: TestDubberID1, titleID: TestTitleID1, episodeOrder: 2, progress: 40, updatedAt: 0 });

      expect(User.user.watchProgress.some(el => el.dubberID === TestDubberID1 && el.titleID === TestTitleID1)).toBeTruthy();

      // Patch exist record
      await User.patchWatchProgress({ dubberID: TestDubberID1, titleID: TestTitleID1, episodeOrder: 5, progress: 40, updatedAt: 0 });

      expect(User.user.watchProgress.find(el => el.dubberID === TestDubberID1 && el.titleID === TestTitleID1)?.episodeOrder).toBe(5);
    });

    test('Reject - title or dubber are not found', async () => {
      try {
        // Title not found
        await User.patchWatchProgress({ dubberID: TestDubberID1, titleID: '_INVALID', episodeOrder: 2, progress: 40, updatedAt: 0 });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof E404) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      try {
        // Dubber not found
        await User.patchWatchProgress({ dubberID: '_INVALID', titleID: TestTitleID1, episodeOrder: 2, progress: 40, updatedAt: 0 });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof E404) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchTelegramData', () => {
    expect(true).toBeTruthy(); // indev
  });

  describe('patchLib', () => {
    test('Pass - Add & remove title from lib', async () => {
      const libID = User.user.libs.find(el => el.type === 'favorite')!.id!;

      expect(User.user.libs.find(el => el.id === libID)?.titles.includes(TestTitleID1)).toBeFalsy();

      // Add new title 
      await User.addToLib({ libID, titleID: TestTitleID1 });

      expect(User.user.libs.find(el => el.id === libID)?.titles.includes(TestTitleID1)).toBeTruthy();

      // Remove title 
      await User.removeFromLib({ libID, titleID: TestTitleID1 });

      expect(User.user.libs.find(el => el.id === libID)?.titles.includes(TestTitleID1)).toBeFalsy();
    });

    test('Reject - Title or lib are not found', async () => {
      const libID = User.user.libs.find(el => el.type === 'favorite')!.id!;

      try {
        // Title not found
        await User.addToLib({ libID, titleID: '_INVALID' });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof E404) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }

      try {
        // Lib not found
        await User.addToLib({ libID: '_INVALID', titleID: TestTitleID1 });

        expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      } catch (e) {
        if (e instanceof E404) { expect(true).toBeTruthy(); } else expect(false).toBeTruthy(); // Invalid error type or error does not thrown
      }
    });
  });

  describe('patchRole', () => {
    expect(true).toBeTruthy(); // indev
  });

  test('patchSubscribes', async () => {
    const event: TNotifyEvent = 'new_episode';
    const key = '12432142';

    expect(User.user.subscribes.includes(`${event}/${key}`)).toBeFalsy();

    // Add new subsctibe
    await User.addSubscribe({ event, key });

    expect(User.user.subscribes.includes(`${event}/${key}`)).toBeTruthy();

    // Remove subsctibe
    await User.removeSubscribe({ event, key });

    expect(User.user.subscribes.includes(`${event}/${key}`)).toBeFalsy();
  });
});