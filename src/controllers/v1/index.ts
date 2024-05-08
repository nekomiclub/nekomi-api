import express from 'express';

const apiUptime = +new Date();

export async function uptime(req: express.Request, res: express.Response) {
  return res.status(200).json(apiUptime);
}