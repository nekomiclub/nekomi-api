import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import axios, { AxiosError } from 'axios';
import ip from 'ip';
import express from 'express';
import * as uuid from 'uuid';

import Dubbers from '../Models/Dubber';
import Title, { createTitle } from '../Models/Title';
import { testMode, devMode, config, prodMode } from '../config';
import User from '../Models/User';
import { user } from './dtos';
import Role, { createRole } from '../Models/Role';
import { TRoleCapability } from '../interfaces/Roles';
import { E500 } from './Errors';
import { ITitle, ITitleEpisode } from '../interfaces/Title';
import { IMock, TMockID } from '../interfaces/Mocks';



/** Create UUID v4 id
 * @param preventPrefix prevent 'devid' prefix. In prod mode set true by default 
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
 */
export function getUTC(time?: number) {
  const now = time ? new Date(time) : new Date();

  return {
    y: now.getUTCFullYear(),
    m: now.getUTCMonth() + 1,
    d: now.getUTCDate(),
    hrs: now.getUTCHours(),
    mins: now.getUTCMinutes(),
    secs: now.getUTCSeconds(),
    ms: now.getUTCMilliseconds(),
    date: `${now.getUTCFullYear()}.${addZeroIfNumberSingle(now.getUTCMonth() + 1)}.${addZeroIfNumberSingle(now.getUTCDate())}`,
    dateReversed: `${addZeroIfNumberSingle(now.getUTCDate())}.${addZeroIfNumberSingle(now.getUTCMonth() + 1)}.${now.getUTCFullYear()}`,
    time: `${addZeroIfNumberSingle(now.getUTCHours())}:${addZeroIfNumberSingle(now.getUTCMinutes())}`,
    timestamp: now.getTime()
  };
}

/** Get file extension from file name
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
export function getMockData<T = any>(req: express.Request, id: TMockID): IMock<T> {
  let mocks: IMock[] = [];

  try {
    mocks = JSON.parse(req.header(config.vars.mockHeader) || '[]');
  } catch (e) {
    console.error(e);
  }

  const mock = mocks.find(el => el.id === id);

  if (!mock) {
    throw new E500(`Mock ${id} undefined`);
  }

  if (mock.code > 400) {
    throw new AxiosError(undefined, `${mock.code}`);
  }

  return mock;
}

interface ICheckValueRules {
  notNaN?: boolean,
  minLength?: number,
  maxLength?: number
}

/** Check value with rules
 * @returns boolean
 */
export function checkValue(value: any, { notNaN, maxLength, minLength }: ICheckValueRules): boolean {
  if (notNaN !== undefined && isNaN(+value)) return false;

  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(+value))) {
    if (minLength !== undefined && +value < minLength) return false;
    if (maxLength !== undefined && +value > maxLength) return false;
  } else {
    if (minLength !== undefined && value.length < minLength) return false;
    if (maxLength !== undefined && value.length > maxLength) return false;
  }

  return true;
}