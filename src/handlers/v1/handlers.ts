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
import express from 'express';

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