import mongoose from 'mongoose';
import request from 'supertest';
import ip from 'ip';

import { config, prodMode } from '../config';
import User from '../Models/User';
import Role from '../Models/Role';
import { createID } from '../handlers/v1/handlers';

const baseUrl = `http://${ip.address()}`;

describe('UserController', () => {
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
});