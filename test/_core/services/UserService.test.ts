process.argv.push('testMode');
process.argv.push('devMode');



import AnimeModel from '~/core/models/AnimeModel';
import RoleModel from '~/core/models/RoleModel';
import UserService from '~/core/services/UserService';
import mongoose from 'mongoose';
import { ERROR } from '~/services/ErrorService';
import { NOTIFY_EVENT, NotifyEventPayload } from '~/services/NotifyService';
import { config } from '~/config';
import { createStringID } from '~/utils/utils';
import { shouldfail } from '~/utils/jest-utils';



beforeAll(() => {
  mongoose.set('strictQuery', false);
  mongoose.connect(config.mongodbUrl, {
    retryWrites: true,
  });
});



describe('UserService', () => {
  const userService = new UserService();



  // Initialize user service
  beforeAll(async () => {
    const user = await userService.create({ username: createStringID(8) });
    await userService.init(user.id);
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
   * [todo] Must upload banner
   * [todo] Must delete old banner if it is not default
   */
  it('should upload banner', async () => {

  });



  /**
   * [todo] Must assign telegram link token
   * [todo] Must throw an error is token already assigned
   */
  it('should set telegram link token', async () => {

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
   * [todo] Must update progress for exist record
   * [todo] Must create new progress record if not exist
   * [todo] Must increase total user viewtime
   */
  it('should patch watch progress', async () => {

  });



  /**
   * [todo] Must delete watch progress record
   */
  it('should delete watch progress', async () => {

  });



  /**
   * [todo] Must increase viewtime
   * [todo] Must set dubber_team_member
   * [todo] Must set isTelegramLinked
   */
  it('should patch statistics', async () => {

  });



  /**
   * [todo] Must patch telegram data & create if not exist
   * [todo] Must remove telegram data
   * [todo] Must throw an error is telegram data not exist & id is not provided
   */
  it('should patch telegram data', async () => {

  });



  /**
   * [+] Must add / remove anime in lib
   * [+] Must validate anime id & lib id
   */
  it('should patch anime in lib (add/remove)', async () => {
    const lib = userService.document!.libs[0]!;
    const anime = (await AnimeModel.find())[0];

    //* Add in lib
    await userService.addInLib(lib.id, anime.uuid);

    expect(userService.document?.libs.find(el => el.id === lib.id)?.titles.includes(anime.uuid)).toBeTruthy();

    // Invalid lib id
    shouldfail(async () => {
      await userService.addInLib('_INVALID', anime.uuid);
    }, ERROR.USER_LIB_NOT_FOUND);

    // Invalid anime id 
    shouldfail(async () => {
      await userService.addInLib(lib.id, '_INVALID');
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