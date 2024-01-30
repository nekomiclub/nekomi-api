import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Dubbers from '../../Models/Dubber';
import Title from '../../Models/Title';
import { env, testMode, devMode, config } from '../../config';
import * as uuid from 'uuid';
import ip from 'ip';
import axios from 'axios';
import inquirer from 'inquirer';

export function writeToLog(msg: string) {
  const time = `${new Date().getUTCDate()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCFullYear()} (${new Date().getUTCHours()}:${new Date().getUTCMinutes()})`;
  fs.appendFileSync(`${path.resolve()}/.log`, `\nINFO (UTC ${time}): ${msg}`);
}

export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
}

export function createInitArchitecture() {
  const root = path.resolve();
  const tmp = `${root}/tmp`;
  const processing = `${tmp}/processing`;
  const uploads = `${tmp}/uploads`;

  const pw = `${root}/pw`;
  const testStorage = `${root}/testStorage`;

  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
  if (!fs.existsSync(processing)) fs.mkdirSync(processing);
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads);
  if (!fs.existsSync(pw)) fs.mkdirSync(pw);
  if (!fs.existsSync(testStorage)) fs.mkdirSync(testStorage);
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

import bcrypt from 'bcrypt';
import { MONGO_URI } from '../../index';
import { ITitleEpisodeDubbed, ITitleEpisodesDub } from '../../core/ITitle';
import User from '../../Models/User';
import Storage from '../../Models/Storage';


export function getUTCTime(): number {
  return +new Date().setUTCHours(new Date().getUTCHours());
}

export async function updateDubbers() {
  const dubbers = await Dubbers.find();

  dubbers.forEach(async dubber => {
    dubber.socials = {
      instagram: null,
      telegram: null,
      tiktok: null,
      youtube: null
    };

    dubber.support = {
      bymeacoffee: null,
      diaka: null,
      monobank: null,
      patreon: null,
      privatbank: null
    };

    dubber.createdAt = +new Date();
    dubber.description = null;
    dubber.leader = null;
    dubber.editors = null;
    dubber.members = null;
    dubber.rating = 9;

    await dubber.save();
  });
}

export async function deleteDoubledEps() {
  let titles = await Title.find();

  titles.forEach(title => {
    const dubs: ITitleEpisodesDub[] = [];

    title.dubs?.forEach(dub => !dubs.some(el => el.id === dub.id) ? dubs.push(dub) : null);
    dubs.forEach(dub => {
      const eps: ITitleEpisodeDubbed[] = [];

      dub.eps.forEach(ep => !eps.some(el => el.order === ep.order) ? eps.push(ep) : null);

      dubs.find(el => el.id === dub.id)!.eps = eps;
    });

    Title.findOneAndUpdate({ id: title.id }, { dubs }).catch(e => console.error(e)).then(() => {
      console.log(`${title.code} was successfully beautified`);
    });
  });
}

export async function updateTitles() {
  const titles = await Title.find();
  const started = +new Date();

  titles.forEach(title => {
    title.set('linkedTitlesIDs', undefined, { strict: false });
    title.set('linkedManga', undefined, { strict: false });

    title.updatedAt = +new Date();

    title.save();
  });

  console.log(`Title updating ended via ${+new Date() - started}ms`);
}

export async function transferDB() {
  const items = await Storage.find();
  const startedAd = +new Date();

  await new Promise(res => {
    items.slice(0, 3).forEach(async (el, i) => {
      if (i === items.slice(0, 3).length - 1) {
        res(1);
      }

      console.log(`Transfer ${el.id}`);

      await axios.post(`${config.microservices.uploadsURL}/v1/tmp/transfer`, {
        id: el.id,
        dateAdded: el.dateAdded,
        URI: el.URI
      });
    });
  });

  console.log(`Ended within ${(+new Date() - startedAd) / 1000}s`);
}