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

/** Turn number to string & add zero before number if it less than 10 */
export function addZeroIfNumberSingle(num: number): string {
  return num <= 9 ? `0${num}` : `${num}`;
}

/** Get full UTC0 time */
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



export async function modifyUsers() {
  const startedAt = getUTC().timestamp;
  let modified = 0;

  console.log(`User modifying started`);

  const users = await User.find();
  const basicRole = await Role.findOne({ code: 'user' });

  if (!basicRole) {
    const basicRole = new Role({
      capabilities: ['basic'],
      code: 'user',
      id: createID(true),
      title: 'User'
    });

    await basicRole.save();
  }

  for (const i in users) {
    const user = users[i];

    // Skip if user has new field
    if (user.id) {
      continue;
    }

    user.id = user.uid;
    user.roles = ['user'];
    modified += 1;

    await user.save();
  }

  console.log(`Users modifying finished within ${((getUTC().timestamp - startedAt) / 1000).toFixed(0)} s. Total modified - ${modified}`);
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

interface IRole {
  code: string,
  caps: TRoleCapability[],
  title: string
}

export async function createRoles() {
  console.log(`Roles creation started`);

  // Support keyword $extend [CODE].
  // It will add caps of specified role to current
  // $extend keyword will be deleted in result array
  const roles: IRole[] = [
    {
      code: 'usr',
      caps: [
        'root'
      ],
      title: 'User'
    }, {
      code: 'admin',
      caps: [
        'admin',
        'staffCreateDubber',
        'staffDeleteDubber',
        'staffDeleteUser',
        // @ts-expect-error this is keyword
        '$extend mod',
        // @ts-expect-error this is keyword
        '$extend editor'
      ],
      title: 'Administrator'
    }, {
      code: 'mod',
      caps: [
        'mod',
        'staffEditDubbers',
        'staffEditUserInfo',
        'staffRestrictUser',
      ],
      title: 'Moderator'
    }, {
      code: 'editor',
      caps: [
        'editor',
        'titleAdd',
        'titleDelete',
        'titleEdit',
        'titleEditEpsMeta',
        'titleEditLinked',
        'seriesAdd',
        'seriesDelete',
      ],
      title: 'Editor'
    }, {
      code: 'user',
      caps: [
        'basic'
      ],
      title: 'User'
    }, {
      code: 'dubber_leader',
      caps: [
        // @ts-expect-error this is keyword
        '$extend dubber_editor',
        'dubberEditEditors'
      ],
      title: 'Dubber/Leader'
    }, {
      code: 'dubber_editor',
      caps: [
        // @ts-expect-error this is keyword
        '$extend dubber_member',
        'seriesAdd',
        'seriesDelete',
        'dubberEditProfile',
        'dubberEditMembers'
      ],
      title: 'Dubber/Editor'
    }, {
      code: 'dubber_member',
      caps: [
        'dubber'
      ],
      title: 'Dubber/Member'
    }
  ];

  // Extend caps
  roles.forEach(role => {
    role.caps.forEach(cap => {
      if (cap.match(/\$extend\s/gi)) {
        const extendByCode = cap.split(' ')[1];

        role.caps = role.caps.filter(el => el !== cap);

        const extendBy = roles.find(el => el.code === extendByCode);

        if (extendBy) {
          extendBy.caps.forEach(cap => !role.caps.includes(cap) ? role.caps.push(cap) : null);
        } else {
          console.log(`[Role]: Extending by ${extendByCode} is not possible (code not found)`);
        }
      }
    });
  });

  for (const key in roles) {
    const role = roles[key];

    // Skip if role with this code is already exist
    if (await Role.findOne({ code: role.code })) {
      continue;
    }

    await createRole({
      id: createID(),
      capabilities: role.caps,
      code: role.code,
      title: role.title
    });
  }

  console.log(`Roles created`);
}

export async function modifyMediaURLs() {
  console.log(`Media URLs modifying started`);

  const titles = await Title.find();

  for (const i in titles) {
    const title = titles[i];

    title.poster = `${config.URL.media}/${getID(title.poster)}`;

    title.dubs?.forEach(dub => {
      dub.eps.forEach(ep => {
        if (ep.source.q1080) ep.source.q1080 = `${config.URL.media}/${getID(ep.source.q1080)}`;
        if (ep.source.q720) ep.source.q720 = `${config.URL.media}/${getID(ep.source.q720)}`;
        if (ep.source.q480) ep.source.q480 = `${config.URL.media}/${getID(ep.source.q480)}`;
        if (ep.source.q240) ep.source.q240 = `${config.URL.media}/${getID(ep.source.q240)}`;

        const newFrames: string[] = [];
        ep.framesURL?.forEach(frame => {
          newFrames.push(`${config.URL.media}/${getID(frame)}`);
        });

        ep.framesURL = newFrames;
      });
    });

    console.log(`Title ${title.id} modified`)
    title.markModified('poster')
    title.markModified('dubs')
    await title.save();
  }

  function getID(url: string): string {
    return url.split('/')[url.split('/').length - 1];
  }

  console.log(`Media URLs modifying ended`);
}