import express from 'express';
import { catchError } from '../../handlers/Errors';
import axios from 'axios';
import { config } from '../../config';
import Role from '../../Models/Role';
import { createID } from '../../handlers/handlers';
import { $http } from '../../handlers/http';

export async function createSnap(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const response = await $http.post(`${config.URL.uploadsBot}/postSnap`, req.body);
    return res.status(200).json(response.data);
  });
}

export async function parseMetadata(req: express.Request, res: express.Response) {
  await catchError(req, res, async () => {
    const response = await $http.post(`${config.URL.uploadsBot}/parseMetadata`, req.body);
    return res.status(200).json(response.data);
  });
}