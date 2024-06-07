import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Dubbers from '../../Models/Dubber';
import Title from '../../Models/Title';
import { testMode, devMode, config, prodMode } from '../../config';
import * as uuid from 'uuid';
import ip from 'ip';
import axios from 'axios';
import express from 'express';
import User from '../../Models/User';
import { user } from '../dtos';
import Role, { createRole } from '../../Models/Role';
import { TRoleCapability } from '../../interfaces/Roles';

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



/** @deprecated in near future log system will be refactored */
export function writeToLog(msg: string) {
  const time = `${new Date().getUTCDate()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCFullYear()} (${new Date().getUTCHours()}:${new Date().getUTCMinutes()})`;
  fs.appendFileSync(`${path.resolve()}/.log`, `\nINFO (UTC ${time}): ${msg}`);
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

export async function updateUsers() {
  const users = await User.find();
  let changed = 0;

  console.log(`Users updated started`);

  for (const key in users) {
    const user = users[key];

    user.set('avatar', undefined, { strict: false });
    user.set('username', undefined, { strict: false });
    user.set('lists', undefined, { strict: false });
    user.set('stats', undefined, { strict: false });

    changed += 1;
    await user.save();
  }

  console.log(`Users updated ended with ${changed} changed users`);
}

export async function updateTitles() {
  const titles = await Title.find();
  let changed = 0;

  console.log(`Titles updating started`);

  for (const key in titles) {
    const title = titles[key];

    title.updatedAt = getUTC().timestamp;

    title.rating = {
      // @ts-ignore
      IMDB: title.rating > 0 ? title.rating : null,
      Animee: null,
    };

    // @ts-ignore
    title.episodesCount = title.estimatedEps! > 0 ? title.estimatedEps! : null;

    if (!Array.isArray(title.names.alt)) {
      title.names.alt = [];
    }

    if (!Array.isArray(title.genres)) {
      title.genres = [];
    }

    if (!Array.isArray(title.studios)) {
      title.studios = [];
    }

    if (!Array.isArray(title.episodesMeta)) {
      title.episodesMeta = [];
    }

    if (title.country.toLowerCase() === 'japan') {
      title.country = 'Japan';
    } else if (title.country.toLowerCase() === 'china') {
      title.country = 'China';
    } else if (title.country.toLowerCase() === 'south corea') {
      title.country = 'South Corea';
    } else {
      title.country = 'Other';
    }


    title.set('background', undefined, { strict: false });
    title.set('newRating', undefined, { strict: false });
    title.set('estimatedEps', undefined, { strict: false });
    title.set('newCountry', undefined, { strict: false });
    title.set('started', undefined, { strict: false });
    title.set('ended', undefined, { strict: false });
    title.set('dubs', undefined, { strict: false });
    title.set('epsMeta', undefined, { strict: false });

    changed += 1;
    await title.save();
  }

  console.log(`Titles updating ended with ${changed} changed titles`);
}