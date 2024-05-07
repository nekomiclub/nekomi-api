import express from 'express';
import { ErrorConstructor, E400, E401, E403, E404, writeErrorLog, E500, catchError } from '../../handlers/v1/Errors';
import fs from 'fs';
import { IUploadRequest, TUpload } from '../../core/IUpload';
import path from 'path';
import { config, devMode } from '../../config';
import ip from 'ip';
import * as authService from '../../services/v1/auth';
import { IStatRecord } from '../../core/interfaces';
import axios, { AxiosError } from 'axios';
import { DAY_STAT } from '../../services/v1/stats';
import Title from '../../Models/Title';

const apiUptime = +new Date();

export async function uptime(req: express.Request, res: express.Response) {
  return res.status(200).json(apiUptime);
}