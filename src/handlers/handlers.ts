import fs, { write } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import axios, { AxiosError } from 'axios';
import ip from 'ip';
import express from 'express';
import * as uuid from 'uuid';

import Dubber from '../Models/Dubber';
import Title from '../Models/Title';
import { testMode, devMode, config, prodMode } from '../config';
import User from '../Models/User';
import { title, user } from './dtos';
import Role, { createRole } from '../Models/Role';
import { TRoleCapability } from '../interfaces/Roles';
import { ITitle, ITitleEpisode } from '../interfaces/Title';
import { IMock, TMockID } from '../interfaces/Mocks.ts';
import { E500 } from '../services/ErrorService';
import { TNotifyEvent } from '../interfaces/services/Notify';
import { Logger } from '../services/LoggerService';





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

  Logger.info(`[Handler/UsersTelegramToken]: Tokens revoked due to server restart`);
}