import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import axios, { AxiosError } from 'axios';
import ip from 'ip';
import express from 'express';
import * as uuid from 'uuid';

import Dubbers from '../Models/Dubber';
import Title, { createTitle } from '../Models/Title';
import { testMode, devMode, config, prodMode, IMockedData } from '../config';
import User from '../Models/User';
import { user } from './dtos';
import Role, { createRole } from '../Models/Role';
import { TRoleCapability } from '../interfaces/Roles';
import { E500 } from './Errors';
import { ITitle } from '../interfaces/Title';



/** Create UUID v4 id
 * @param preventPrefix prevent 'devid' prefix. In prod mode set true by default
 * @version re-1.0.0
 */
export function createID(preventPrefix?: boolean): string {
  return preventPrefix || prodMode ? uuid.v4() : `devid-${uuid.v4()}`;
}

/** Get random number in range
 * @version re-1.0.0
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

/** Turn number to string & add zero before number if it less than 10
 * @version re-1.0.0
 */
export function addZeroIfNumberSingle(num: number): string {
  return num <= 9 ? `0${num}` : `${num}`;
}

/** Get full UTC0 time
 * @requires addZeroIfNumberSingle()
 * @version re-1.0.0
 */
export function getUTC() {
  const now = new Date();

  return {
    y: now.getUTCFullYear(),
    m: now.getUTCMonth() + 1,
    d: now.getUTCDate(),
    hrs: now.getUTCHours(),
    mins: now.getUTCMinutes(),
    secs: now.getUTCSeconds(),
    ms: now.getUTCMilliseconds(),
    date: `${now.getUTCFullYear()}.${addZeroIfNumberSingle(now.getUTCMonth() + 1)}.${addZeroIfNumberSingle(now.getUTCDate())}`,
    time: `${addZeroIfNumberSingle(now.getUTCHours())}:${addZeroIfNumberSingle(now.getUTCMinutes())}`,
    timestamp: now.getTime()
  };
}

/** Get file extension from file name
 * @version re-1.0.0
 * @example
 * getFileExtension('file.txt') => txt
 * getFileExtension('file.test.txt') => txt
 */
export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
}

/** Parse user roles and return capabilities */
export async function parseRoles(rolesArr: string[]): Promise<TRoleCapability[]> {
  const caps: TRoleCapability[] = [];

  const roles = await Role.find({
    code: {
      '$in': rolesArr
    }
  });

  roles.forEach(role => {
    role.capabilities.forEach(cap => {
      if (!caps.includes(cap)) caps.push(cap);
    });
  });

  return caps;
}

/** Get mock data */
export function getMockData<T = any>(req: express.Request, key: string): IMockedData<T> {
  let mocks: IMockedData[] = [];

  try {
    mocks = JSON.parse(req.header(config.vars.mockHeader) || '[]');
  } catch (e) {
    console.error(e);
  }

  const mock = mocks.find(el => el.id === key);

  if (!mock) {
    throw new E500(`Mock ${key} undefined`);
  }

  if (mock.code > 400) {
    throw new AxiosError(undefined, `${mock.code}`);
  }

  return mock;
}