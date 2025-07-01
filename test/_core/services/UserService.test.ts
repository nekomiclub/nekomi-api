process.argv.push('testMode');
process.argv.push('devMode');



import AnimeModel from '~/core/models/AnimeModel';
import AnimeService from '~/core/services/AnimeService';
import DubberModel from '~/core/models/DubberModel';
import RoleModel from '~/core/models/RoleModel';
import UserService from '~/core/services/UserService';
import mongoose from 'mongoose';
import { ERROR } from '~/services/ErrorService';
import { NOTIFY_EVENT, NotifyEventPayload } from '~/services/NotifyService';
import { TestFile, shouldfail } from '~/utils/jest-utils';
import { config } from '~/config';
import { createStringID } from '~/utils/utils';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



describe('UserService', () => {
  const userService = new UserService();
  const animeService = new AnimeService();



  // Initialize user service
  beforeAll(async () => {
    const user = await userService.create({ username: createStringID(8) });
    await userService.init(user.id);

    const anime = await animeService.create({ nameEng: createStringID(12) });
    await animeService.init(anime.uuid);
  });



  /**
   * [+] Must set new avatar Url
   */
  it('should set avatar', async () => {
    const avatarUrl = 'https://lolkek.com';

    userService.setAvatar(avatarUrl);

    expect(userService.document?.avatar).toBe(avatarUrl);
  });



  /**
   * [+] Must upload banner
   * [+] Must delete old banner if it is not default
   */
  it('should upload banner', async () => {
    expect(userService.document?.banner).toBe(config.vars.defaultBanner);

    const uploadPayload = await userService.uploadBanner(TestFile);
    expect(uploadPayload.oldBannerRemoved).toBeFalsy();

    const uploadPayload2 = await userService.uploadBanner(TestFile);
    expect(uploadPayload2.oldBannerRemoved).toBeTruthy();
  });



  /**
   * [+] Must assign telegram link token
   * [+] Must throw an error is token already assigned
   */
  it('should set telegram link token', async () => {
    const token = 'tgtoken000';

    await userService.setTelegramLinkToken(token);
    expect(userService.document?.telegramLinkToken).toBe(token);

    await userService.setTelegramLinkToken(null);
    expect(userService.document?.telegramLinkToken).toBe(null);

    // Token already assigned
    shouldfail(async () => {
      const newToken = 'tgtoken111';

      const newUserService = new UserService();
      const newUser = await newUserService.create({ username: 'hellobob' });
      await newUserService.init(newUser.id);
      await newUserService.setTelegramLinkToken(newToken);

      await userService.setTelegramLinkToken(newToken);
    }, ERROR.USER_TGTOKEN_ASSIGNED);
  });



  /**
   * [+] Must set username
   */
  it('should set username', async () => {
    const username = 'nekomememememe';

    userService.setUsername(username);

    expect(userService.document?.username).toBe(username);
  });



  /**
   * [+] Must create new progress record if not exist
   * [+] Must update progress for exist record
   * [+] Must check that episode, dubber & anime exist
   */
  it('should patch watch progress', async () => {
    const dubber = (await DubberModel.find())[0];
    const anime = animeService.anime;

    // Push anime episode
    animeService.document!.episodes = [{ dubberID: dubber.id, frames: [], order: 12, qualities: { q1080: '', q240: '', q480: '', q4k: '', q720: ' ' } }];
    animeService.document?.markModified('episodes');
    await animeService.document?.save();

    //* Create new record
    await userService.patchWatchProgress({ dubberID: dubber.id, titleID: anime.uuid, episodeOrder: 12, progress: 42.12 });
    expect(userService.document?.watchProgress.find(el => el.titleID === anime.uuid && el.dubberID === dubber.id)?.episodeOrder).toBe(12);

    //* Update record
    await userService.patchWatchProgress({ dubberID: dubber.id, titleID: anime.uuid, episodeOrder: 4, progress: 42.12 });
    expect(userService.document?.watchProgress.find(el => el.titleID === anime.uuid && el.dubberID === dubber.id)?.episodeOrder).toBe(4);

    // Anime does not exist
    shouldfail(async () => {
      await userService.patchWatchProgress({ dubberID: dubber.id, titleID: '_INVALID', episodeOrder: 42, progress: 42.12 });
    }, ERROR.ANIME_NOT_FOUND);

    // Dubber does not exist
    shouldfail(async () => {
      await userService.patchWatchProgress({ dubberID: '_INVALID', titleID: anime.uuid, episodeOrder: 42, progress: 42.12 });
    }, ERROR.DUBBER_NOT_FOUND);

    // Episode does not exist
    shouldfail(async () => {
      await userService.patchWatchProgress({ dubberID: dubber.id, titleID: anime.uuid, episodeOrder: 42, progress: 42.12 });
    }, ERROR.ANIME_EPISODE_NOT_FOUND);
  });



  /**
   * [+] Must delete watch progress record
   */
  it('should delete watch progress', async () => {
    const dubberId = '1212';
    const anime = animeService.anime;

    userService.document?.watchProgress.push({
      dubberID: dubberId,
      episodeOrder: 3,
      progress: 42.12,
      titleID: anime.uuid,
      updatedAt: 0
    });

    expect(userService.document?.watchProgress.find(el => el.titleID === anime.uuid && el.dubberID === dubberId)).toBeTruthy();

    userService.removeWatchProgress(anime.uuid);
    expect(userService.document?.watchProgress.find(el => el.titleID === anime.uuid && el.dubberID === dubberId)).toBeFalsy();
  });



  /**
   * [+] Must increase viewtime
   * [+] Must limit increasing viewtime
   * [+] Must set dubber_team_member
   * [+] Must check if dubber exist in dubberTeamMember 
   * [+] Must set isTelegramLinked
   */
  it('should patch statistics', async () => {
    //* increase viewtime
    await userService.patchStatistics({ increaseViewtime: 12 });
    await userService.patchStatistics({ increaseViewtime: 12 });

    expect(userService.document?.statistics.viewtime).toBe(24);

    // increase max viewtime
    await userService.patchStatistics({ increaseViewtime: config.VALIDATION.User.MaximumIncreaseViewtime + 10 }); // + 10 will be skipped

    expect(userService.document?.statistics.viewtime).toBe(config.VALIDATION.User.MaximumIncreaseViewtime + 24);

    //* dubber team member
    const dubber = (await DubberModel.find())[0];

    await userService.patchStatistics({ dubberTeamMember: dubber.id });

    // invalid dubber
    shouldfail(async () => {
      await userService.patchStatistics({ dubberTeamMember: '_INVALID' });
    }, ERROR.DUBBER_NOT_FOUND);

    //* is telegram linked
    await userService.patchStatistics({
      isTelegramLinked: true
    });

    expect(userService.document?.statistics.isTelegramLinked).toBe(true);
  });



  /**
   * [+] Must patch telegram data & create if not exist
   * [+] Must remove telegram data
   * [+] Must throw an error is telegram data not exist & id is not provided
   */
  it('should patch telegram data', async () => {
    const id = 111;

    //* Create telegram data
    userService.patchTelegramData({ id });
    expect(userService.document?.telegramData?.id).toBe(id);

    //* Edit telegram data
    const id2 = 222;

    userService.patchTelegramData({ id: id2 });
    expect(userService.document?.telegramData?.id).toBe(id2);

    //* Remove telegram data
    userService.patchTelegramData({}, true);
    expect(userService.document?.telegramData).toBe(null);

    // Cannot create telegram data due to id miss
    shouldfail(async () => {
      userService.patchTelegramData({});
    }, ERROR.USER_TGDATA_ID_MISS);
  });



  /**
   * [+] Must add / remove anime in lib
   * [+] Must validate anime id & lib id
   */
  it('should patch anime in lib (add/remove)', async () => {
    const lib = userService.document!.libs[0]!;
    const anime = (await AnimeModel.find())[0];

    //* Add in lib
    await userService.appendInLib(lib.id, anime.uuid);

    expect(userService.document?.libs.find(el => el.id === lib.id)?.titles.includes(anime.uuid)).toBeTruthy();

    // Invalid lib id
    shouldfail(async () => {
      await userService.appendInLib('_INVALID', anime.uuid);
    }, ERROR.USER_LIB_NOT_FOUND);

    // Invalid anime id 
    shouldfail(async () => {
      await userService.appendInLib(lib.id, '_INVALID');
    }, ERROR.ANIME_NOT_FOUND);

    //* Remove from lib
    userService.removeFromLib(lib.id, anime.uuid);

    expect(userService.document?.libs.find(el => el.id === lib.id)?.titles.includes(anime.uuid)).toBeFalsy();

    // Invalid lib id
    shouldfail(async () => {
      userService.removeFromLib('_INVALID', anime.uuid);
    }, ERROR.USER_LIB_NOT_FOUND);
  });



  /**
   * [+] Must add / remove role
   * [+] Must validate role slug
   */
  it('should patch role (add/remove)', async () => {
    const role = (await RoleModel.find())[0];

    //* Add role
    await userService.addRole(role.id);

    expect(userService.document?.roles.includes(role.code)).toBeTruthy();

    // Invalid role slug
    shouldfail(async () => {
      await userService.addRole('_INVALID');
    });

    //* Remove role
    await userService.removeRole(role.id);

    expect(userService.document?.roles.includes(role.code)).toBeFalsy();

    // Invalid role slug
    shouldfail(async () => {
      await userService.removeRole('_INVALID');
    });
  });



  /**
   * [+] Must add / remove subscription
   */
  it('should patch subscriptions (add/remove)', async () => {
    const notify: NotifyEventPayload<string> = { event: NOTIFY_EVENT.AIRING_STARTED, payload: 'animeid' };

    //* Add subscription
    const subscription = userService.addSubscribe(notify);

    expect(userService.document?.subscribes.includes(subscription)).toBeTruthy();

    //* Remove subscription
    userService.removeSubscribe(notify);

    expect(userService.document?.subscribes.includes(subscription)).toBeFalsy();
  });



  /**
   * [+] Return user lib, where each anime exist (fix not existed)
   */
  it(`should fix user lib anime documnets`, async () => {
    const anime = (await AnimeModel.find())[0];

    userService.document!.libs[0].titles = [anime.uuid, 'invalid'];
    expect(userService.document!.libs[0].titles.length).toBe(2);

    await userService.fixLibAnimeDocuments(userService.document!.libs[0].id);
    expect(userService.document!.libs[0].titles.length).toBe(1);
  });
});