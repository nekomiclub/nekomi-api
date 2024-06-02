import mongoose from 'mongoose';
import request from 'supertest';
import ip from 'ip';

import { config, prodMode } from '../config';
import User, { createUser } from '../Models/User';
import Role from '../Models/Role';
import { createID } from '../handlers/v1/handlers';

const baseUrl = `http://${ip.address()}`;

describe('UserController', () => {
  beforeAll(async () => {
    await mongoose.connect(`mongodb://${prodMode ? `${config.service.DB!.PROD.USR}:${config.service.DB!.PROD.PWD}` : `${config.service.DB!.DEV.USR}:${config.service.DB!.DEV.PWD}`}@${config.db.HOST}:${config.db.PORT}/${prodMode ? config.service.DB!.PROD.DB_NAME : config.service.DB!.DEV.DB_NAME}`);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });



  describe('POST /user/auth', () => {
    /*
      Authorize user (set usapi token in cookie)

      If provided user id does not exist in animee DB, it will send GET request, then will try to find user by its email.
      If user with email will be founded, it will assing new user id (from usapi)
      If not, it will create new user

      User creation methods can not be tested due to standalone tests. 
    */
    const testingRoute = '/user/auth';

    test('Should set cookie', () => {
      request(baseUrl)
        .post(testingRoute)
        .send({
          session: 'dummy-main'
        })
        .expect(200);
    });

    test('Should reject', () => {
      request(baseUrl)
        .post(testingRoute)
        .send({
          session: 'invalid id'
        })
        .expect(404);
    });
  });

  describe('$ PATCH /user', () => {
    /*
      User can patch it`s own account

      * Methods
      * editFolderItem
      


      * editFolderItem method
      * 200 - User modified (will delete or add title to specified folder)
      * 400 - Invalid payload (requires folderId and titleId)
    */

    const testingRoute = '/user';
    const titleId = '1cbc1ef7-8d88-433a-908b-4df859770ab4';
    let folderId = '';
    const dummyID = config.tests.UserController.$1.dummyUser;

    // Create dummy user
    beforeAll(async () => {
      await createUser({
        avatarURL: '',
        id: dummyID,
        username: dummyID
      });

      const user = await User.findOne({ id: dummyID });

      folderId = user!.lists[0].id;
    });

    // Delete dummy user
    afterAll(async () => {
      await User.findOneAndDelete({ id: dummyID });
    });

    //* editFolderItem
    test('$1 EditFolderItem should add/remove title to folder', async () => {
      //* Add title
      await request(baseUrl)
        .patch(testingRoute)
        .set('Cookie', `${config.vars.sessionCookieName}=${dummyID}`)
        .send({
          method: 'editFolderItem',
          folderId,
          titleId
        })
        .expect(200);

      // Get user object
      const user1 = await User.findOne({ id: dummyID });

      // Ensure that method add title to folder
      expect(user1!.lists.find(el => el.id === folderId)!.titles.includes(titleId)).toBeTruthy();



      //* Remove title
      await request(baseUrl)
        .patch(testingRoute)
        .set('Cookie', `${config.vars.sessionCookieName}=${dummyID}`)
        .send({
          method: 'editFolderItem',
          folderId,
          titleId
        })
        .expect(200);

      // Get user object
      const user2 = await User.findOne({ id: dummyID });

      // Ensure that method remove title from folder
      expect(user2!.lists.find(el => el.id === folderId)!.titles.includes(titleId)).toBeFalsy();
    });
  });
});