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

export async function updateTitles() {
  const titles = await Title.find();
  let changed = 0;

  console.log(`Titles migration started`);

  for (const key in titles) {
    const title = titles[key];

    title.updatedAt = getUTC().timestamp;

    title.newRating = {
      IMDB: title.rating !== null && title.rating > 0 ? title.rating : null,
      Animee: null
    };

    title.episodesCount = title.estimatedEps !== null && title.estimatedEps > 0 ? title.estimatedEps : null;
    title.episodesMeta = title.epsMeta;
    title.names.alt = title.names.alt?.length ? title.names.alt : null;
    title.genres = title.genres?.length ? title.genres : null;

    if (title.country.toLowerCase() === 'japan') {
      title.newCountry = 'Japan';
    } else if (title.country.toLowerCase() === 'south corea') {
      title.newCountry = 'South Corea';
    } else if (title.country.toLowerCase() === 'china') {
      title.newCountry = 'China';
    } else {
      console.log(`Country not parsed in ${title.id} - ${title.country}`);
      title.newCountry = 'Other';
      title.details = title.details || '' + `${title.details ? '\n' : ''}Країна не визначена (${title.country}). Будь ласка, створіть про це тікет на діскорд сервері`;
    }

    if (title.dubs) {
      title.episodes = [];

      title.dubs.forEach(dub => {
        dub.eps.forEach(ep => {
          title.episodes!.push({
            dubberID: dub.id,
            frames: ep.framesURL,
            order: ep.order,
            qualities: {
              q1080: ep.source.q1080,
              q4k: ep.source.q2k,
              q720: ep.source.q720,
              q480: ep.source.q480,
              q240: ep.source.q240,
            }
          });
        });
      });
    } else {
      title.episodes = null;
    }

    changed += 1;
    await title.save();
  }

  console.log(`Titles migration ended with ${changed} changed titles`);
}

export async function updateUsers() {
  const users = await User.find();
  let changed = 0;

  console.log(`Users migration started`);

  for (const key in users) {
    const user = users[key];

    user.set('uid', undefined, { strict: false });
    user.set('email', undefined, { strict: false });
    user.set('password', undefined, { strict: false });
    user.set('profileBg', undefined, { strict: false });
    user.set('badgesIDs', undefined, { strict: false });
    user.set('accountType', undefined, { strict: false });
    user.set('providers', undefined, { strict: false });
    user.set('settings', undefined, { strict: false });

    user.libs = [];

    user.statistics = {
      accountCreated: user.stats.createdAt,
      timeSpent: 0
    };

    user.lists.forEach(list => {
      const isPrivate = Boolean(list.id.match(/favorite|watched|plans|delayed|watching/gi));

      user.libs.push({
        id: list.id,
        createdAt: list.createdAt,
        settings: {
          hidden: Boolean(list.id.match(/plans|delayed/gi)),
          immortal: isPrivate,
          name: list.name
        },
        titles: list.titles,
        type: list.id.includes('favorite') ? 'favorite' : list.id.includes('watched') ? 'watched' : list.id.includes('watching') ? 'watching' : list.id.includes('plans') ? 'plans' : list.id.includes('delayed') ? 'delayed' : 'custom'
      });
    });

    changed += 1;
    await user.save();
  }

  console.log(`Users migration ended with ${changed} changed users`);
}