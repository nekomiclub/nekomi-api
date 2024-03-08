import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Dubbers from '../../Models/Dubber';
import Title from '../../Models/Title';
import { testMode, devMode, config } from '../../config';
import * as uuid from 'uuid';
import ip from 'ip';
import axios from 'axios';
import inquirer from 'inquirer';
import express from 'express';
import User from '../../Models/User';

export function writeToLog(msg: string) {
  const time = `${new Date().getUTCDate()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCFullYear()} (${new Date().getUTCHours()}:${new Date().getUTCMinutes()})`;
  fs.appendFileSync(`${path.resolve()}/.log`, `\nINFO (UTC ${time}): ${msg}`);
}

export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
}

export function randomNumber(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

/** @deprecated Use getUTC() instead */
export function getUTCTime(): number {
  return +new Date().setUTCHours(new Date().getUTCHours());
}

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

export function addZeroIfNumberSingle(num: number): string {
  return num <= 9 ? `0${num}` : `${num}`;
}

export function getUTC(): { y: number, m: number, d: number, hrs: number, mins: number, secs: number, ms: number, date: string, time: string, timestamp: number } {
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
  console.log('Users modify started');
  const users = await User.find();

  for (const i in users) {
    const user = users[i];

    user.accountType = 'old';
    await user.save();
  }

  console.log('Users modify ended');
}