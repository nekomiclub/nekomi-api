import mongoose from 'mongoose';
import request from 'supertest';
import ip from 'ip';

import { config, prodMode } from '../config';
import User from '../Models/User';
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

  describe('PATCH /user', () => {
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

    //* editFolderItem
    test('EditFolderItem should add title to folder', async () => {

    });

    test('EditFolderItem should remove title from folder', async () => {

    });
  });
});