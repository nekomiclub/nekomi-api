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



/** @deprecated in near future log system will be refactored */
export function writeToLog(msg: string) {
  const time = `${new Date().getUTCDate()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCFullYear()} (${new Date().getUTCHours()}:${new Date().getUTCMinutes()})`;
  fs.appendFileSync(`${path.resolve()}/.log`, `\nINFO (UTC ${time}): ${msg}`);
}

/** Get file extension from file name
 * @example
 * getFileExtension('file.txt') => txt
 * getFileExtension('file.test.txt') => txt
 */
export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
}

/** @deprecated Use getUTC() instead */
export function getUTCTime(): number {
  return +new Date().setUTCHours(new Date().getUTCHours());
}

/** @deprecated Idk */
export async function updateFrames() {
  const titles = await Title.find();

  console.log(`Started with ${titles.filter(el => el.dubs?.length).length} titles`);

  for (const i in titles) {
    const title = titles[i];

    if (!title.dubs!.length) {
      console.log(`Title ${title.id} skipped (no dubs provided).`);
      continue;
    }

    try {
      console.log(`Send ${title.id}`);
      await axios.post(`${config.microservices.uploadsURL}/v1/updateFrame`, { dubs: title!.dubs || [] });
    } catch (e) {
      console.error(e);
    }
  }
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


/** Return posters URL handler */
export async function returnPosters() {
  const titles = await Title.find();
  console.log(`Title posters rollback started`);

  for (const key in titles) {
    const title = titles[key];
    const posterID = title.poster.split('/')[title.poster.split('/').length - 1];

    if (!posterID.match(/\./gi)) continue;

    // Set background as poster (old version of poster)
    title.poster = title.background;

    title.markModified('poster');
    await title.save();
    console.log(`Title ${title.id} poster rolled back`);
  }

  console.log(`Title posters rollback ended!`);
}