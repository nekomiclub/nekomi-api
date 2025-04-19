process.argv.push('testMode');
process.argv.push('devMode');



import AnimeModel from '~/core/models/AnimeModel';
import UserService from '~/core/services/UserService';
import createID from '~/utils/create-id';
import mongoose from 'mongoose';
import { config } from '~/config';



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
    const user = await userService.create({ username: createID(8) });
    await userService.init(user.id);
  });



  /**
   * [+] Anime documents that are not exist in AnimeModel, but present in user lib must be removed
   */
  it(`should fix user lib anime documnets`, async () => {
    const anime = (await AnimeModel.find())[0];

    userService.document!.libs[0].titles = [anime.uuid, 'invalid'];
    expect(userService.document!.libs[0].titles.length).toBe(2);

    await userService.fixLibAnimeDocuments(userService.document!.libs[0].id);
    expect(userService.document!.libs[0].titles.length).toBe(1);
  });
});