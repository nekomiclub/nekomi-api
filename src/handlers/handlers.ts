import fs, { write } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import axios, { AxiosError } from 'axios';
import ip from 'ip';
import express from 'express';
import * as uuid from 'uuid';

import Dubber from '../Models/Dubber';
import Title, { createTitle } from '../Models/Title';
import { testMode, devMode, config, prodMode } from '../config';
import User from '../Models/User';
import { user } from './dtos';
import Role, { createRole } from '../Models/Role';
import { TRoleCapability } from '../interfaces/Roles';
import { E500, writeLog } from './Errors';
import { ITitle, ITitleEpisode } from '../interfaces/Title';
import { IMock, TMockID } from '../interfaces/Mocks';
import { TNotifyEvent } from '../services/NotifyService';



/** Create UUID v4 id
 * @param preventPrefix prevent 'devid' prefix. In prod mode set true by default 
*/
export function createID(preventPrefix?: boolean): string {
  return preventPrefix || prodMode ? uuid.v4() : `devid-${uuid.v4()}`;
}

/** Get random number in range */
export function randomNumber(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

/** Turn number to string & add zero before number if it less than 10 */
export function addZeroIfNumberSingle(num: number): string {
  return num <= 9 ? `0${num}` : `${num}`;
}

/** Get full UTC0 time 
 * @param time Timestamp to start from
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

export async function patchUsersModels() {
  const startedAt = getUTC().timestamp;
  const users = await User.find();
  let usersModified = 0;

  console.log(`Users models patching started`);

  for (const key in users) {
    const user = users[key];

    user.statistics.viewtime = +(user.statistics.viewtime || user.statistics.timeSpent * 60).toFixed(0);
    user.statistics.isTelegramLinked = user.statistics.isTelegramLinked || false;
    user.watchProgress = user.watchProgress || [];
    user.subscribes = user.subscribes || [];
    user.telegramData = user.telegramData || null;
    user.telegramLinkToken = user.telegramLinkToken || null;

    user.libs.find(el => el.type === 'watching')?.titles.forEach(id => {
      const event: TNotifyEvent = 'new_episode';
      user.subscribes.push(`${event}/${id}`);
    });

    user.markModified('watchProgress');
    user.markModified('subscribes');
    user.markModified('statistics');
    user.markModified('telegramData');

    await user.save();

    usersModified += 1;
  }

  console.log(`Users models patching ended within - ${((getUTC().timestamp - startedAt) / 1000).toFixed(2)}s. Modified ${usersModified} - users`);
}

export function makeStringID(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

/** Remove users telegramLinkToken */
export async function removeUsersLinkTelegramToken() {
  const users = await User.find({ telegramLinkToken: { $ne: null } });

  if (!users.length) return;

  for (const key in users) {
    const user = users[key];

    user.telegramLinkToken = null;
    user.markModified('telegramLinkToken');

    await user.save();
  }

  writeLog('info', `Users telegram link tokens removed`, 'removeUsersLinkTelegramToken');
}

/** Parse WEK, MON MM, YYYY */
export function parseIMDBDate(dateString: string): number {
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const dateParts = dateString.split(' ');

  const day = parseInt(dateParts[2]);
  const month = months[dateParts[1]];
  const year = parseInt(dateParts[3]);


  return +new Date(year, month, day);
}

// export async function parseTitles() {
//   const startedAt = getUTC().timestamp;
//   const titles = JSON.parse(fs.readFileSync(`${path.resolve()}/src/titles.json`).toString()).titles as ITitle[];

//   console.log(`Titles parsing started`);

//   for (const key in titles) {
//     const title = titles[key];

//     await createTitle('ROOT_MAL_PARSING', title);
//   }

//   console.log(`Titles parsing ended within ${((getUTC().timestamp - startedAt) / 1000).toFixed(2)} with pushed ${titles.length} titles`);
// }

export async function updateDubbers() {
  const startedAt = getUTC().timestamp;
  writeLog(`info`, `[DubbersUpdating]: Updating started`, `updateDubbers`);

  const dubbers = await Dubber.find();
  let touched = 0;

  for (const key in dubbers) {
    const dubber = dubbers[key];

    try {
      dubber.membersInvitePending = dubber.membersInvitePending || [];
      dubber.avatar = dubber.avatar || dubber.thumbURL;

      // dubber.set('rating', undefined, { strict: false });

      await dubber.save();

      touched += 1;
      writeLog(`info`, `[DubbersUpdating]: Dubber ${dubber.name}/${dubber.id} updated`, `updateDubbers`);
    } catch (e) {
      writeLog(`error`, `[DubbersUpdating]: An error occured while updating ${dubber.name}/${dubber.id} - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`, 'updateDubbers');
    }
  }

  writeLog(`info`, `[DubbersUpdating]: Updating ended within ${((getUTC().timestamp - startedAt) / 1000).toFixed(2)}. Touched - ${touched} dubbers`, `updateDubbers`);
}