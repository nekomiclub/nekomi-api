import mongoose from 'mongoose';
import request from 'supertest';
import ip from 'ip';

import { config, prodMode } from '../config';
import User from '../Models/User';
import Role from '../Models/Role';
import { createID } from '../handlers/handlers';

jest.mock('axios');
const baseUrl = `http://${ip.address()}`;

describe('DevController', () => {
  beforeAll(async () => {
    await mongoose.connect(`mongodb://${prodMode ? `${config.service.DB!.PROD.USR}:${config.service.DB!.PROD.PWD}` : `${config.service.DB!.DEV.USR}:${config.service.DB!.DEV.PWD}`}@${config.db.HOST}:${config.db.PORT}/${prodMode ? config.service.DB!.PROD.DB_NAME : config.service.DB!.DEV.DB_NAME}`);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('$1 AccessControll', () => {
    /*
      * AccessControll is a middleware, that checks user auth by it`s Authorization token (session provided by fullkekw usapi)

      ! -------- TEST DETAILS
      * Case in config - DevController/$1
      * Testing route /dev/AccessControll
      ! -------- TEST DETAILS

      * 200 - User with correct role should be passed
      * 200 - User with root role should be passed

      * 400 - User with invalid id should be rejected
      * 401 - User without Authorization token should be rejected
      * 403 - User without right permission should be rejected
      * 404 - User with invalid ID should be rejected (Testing not required)
    */

    const testingRoute = `/dev/AccessControll`;
    const testData = config.tests.DevController.$1;
    let roleID = createID();

    beforeAll(async () => {
      const role = new Role({
        capabilities: ['dubber'],
        code: 'dummy_dubber_member',
        id: roleID,
        title: 'Dubber'
      });

      await role.save();

      const dummy = new User({
        email: testData.dummyRightID,
        id: testData.dummyRightID,
        lists: [],
        roles: ['user', 'dummy_dubber_member'],
        settings: {},
        username: testData.dummyRightID
      });

      await dummy.save();

      const dummy0 = new User({
        email: testData.dummyRootID,
        id: testData.dummyRootID,
        lists: [],
        roles: ['user', 'root'],
        settings: {},
        username: testData.dummyRootID
      });

      await dummy0.save();

      const dummy2 = new User({
        email: testData.dummyID,
        id: testData.dummyID,
        lists: [],
        roles: ['user'],
        settings: {},
        username: testData.dummyID
      });

      await dummy2.save();
    });

    // Pass
    test('200 - User with correct role should be passed', async () => {
      request(baseUrl)
        .get(testingRoute)
        .set({
          'Authorization': `Bearer=${testData.dummyRightID}`
        })
        .expect(200);
    });

    test('200 - User with root role should be passed', () => {
      request(baseUrl)
        .get(testingRoute)
        .set({
          'Authorization': `Bearer=${testData.dummyRootID}`
        })
        .expect(200);
    });


    // Reject
    test('403 - User without right permission should be rejected', () => {
      request(baseUrl)
        .get(testingRoute)
        .set({
          'Authorization': `Bearer=${testData.dummyID}`
        })
        .expect(403);
    });

    // Validation
    test('400 - User with invalid id should be rejected', () => {
      request(baseUrl)
        .get(testingRoute)
        .set({
          'Authorization': `Bearer=INVALID_ID`
        })
        .expect(400);
    });

    test('401 - User without Authorization token should be rejected', () => {
      request(baseUrl)
        .get(testingRoute)
        .expect(401);
    });

    afterAll(async () => {
      await Role.findOneAndDelete({ id: roleID });
      await User.findOneAndDelete({ id: testData.dummyRightID });
      await User.findOneAndDelete({ id: testData.dummyRootID });
      await User.findOneAndDelete({ id: testData.dummyID });
    });
  });

  // describe('CSRFCheck', () => {
  //   /*
  //     * CSRF Check is a middleware, that should pass requests only from expected origins

  //     ! -------- TEST DETAILS
  //     * Middleware get token from X-CSRF-Token header
  //     * Route expect example.com as origin
  //     ! -------- TEST DETAILS

  //     * 200 - Valid & expected origin
  //     * 403 - CSRF required (Header undefined)
  //     * 403 - CSRF rejected (Token not verified)
  //     * 403 - CSRF rejected (Token used before)
  //     * 403 - CSRF origin missmatch (Origin not example.com)
  //   */

  //   const testURL = `/dev/CSRFCheck`;

  //   test('200 - Valid & expected origin', async () => {
  //     await request(baseUrl)
  //       .get(testURL)
  //       .set('X-CSRF-Token', '*-example.com')
  //       .expect(200);
  //   });

  //   test('403 - CSRF required (Header undefined)', async () => {
  //     await request(baseUrl)
  //       .get(testURL)
  //       .expect(403);
  //   });

  //   test('403 - CSRF rejected (Token not verified)', async () => {
  //     await request(baseUrl)
  //       .get(testURL)
  //       .set('X-CSRF-Token', 'dummy')
  //       .expect(403);
  //   });

  //   test('403 - CSRF rejected (Token used before)', async () => {
  //     await request(baseUrl)
  //       .get(testURL)
  //       .set('X-CSRF-Token', 'dummy')
  //       .expect(200);

  //     await request(baseUrl)
  //       .get(testURL)
  //       .set('X-CSRF-Token', 'dummy')
  //       .expect(403);
  //   });


  //   test('CSRF origin missmatch (Origin not example.com)', async () => {
  //     await request(baseUrl)
  //       .get(testURL)
  //       .set('X-CSRF-Token', '*-animee.club')
  //       .expect(403);
  //   });
  // });
});