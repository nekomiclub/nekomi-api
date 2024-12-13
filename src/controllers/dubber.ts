import * as dto from '../handlers/dtos';
import Dubber, { DubberModel, DubberService } from '../Models/Dubber';
import UserModel from '../Models/User';
import express from 'express';
import { E404, ERR_MIDDLEWARE_REQUIRED, HandleRequest } from '../services/ErrorService';

export async function getOne(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const { query } = req.params;

    const dubber = await Dubber.findOne({ $or: [{ id: query }, { code: query }, { slug: query }] });
    if (!dubber) throw new E404(`Dubber ${query} is not found`);

    return res.status(200).json({ message: 'ok', dubber: dto.dubber(dubber.toObject()) });
  });
}

export async function inviteVerify(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);

    const { dubber_id } = req.params as { dubber_id: string };
    const { id: user_id } = req.nekomi.user!;

    const dubber = await DubberModel.findOne({ id: dubber_id });
    if (!dubber) throw new E404(`Dubber ${dubber_id} is not found`);

    const verified = dubber.members_invited.includes(user_id);

    return res.status(200).json({
      message: 'OK',
      verified
    });
  });
}

export async function getAll(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const dubbers = await Dubber.find();

    return res.status(200).json({ message: 'ok', dubbers: dubbers.map(dubber => dto.dubber(dubber.toObject())) });
  });
}

export async function inviteSend(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { user_id, dubber_id } = req.body as { user_id: string, dubber_id: string };

    const user = await UserModel.findOne({ id: user_id });
    if (!user) throw new E404(`User ${user_id} is not found`);

    const dubber = await DubberModel.findOne({ id: dubber_id });
    if (!dubber) throw new E404(`Dubber ${dubber_id} is not found`);

    const dubberService = new DubberService({ dubber });
    await dubberService.inviteMember(user_id);

    return res.status(200).json({
      message: `User ${user_id} invited to the ${dubber_id} dubber team`
    });
  });
}

export async function inviteAccept(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { dubber_id } = req.body as { dubber_id: string };
    const { id: user_id } = req.nekomi.user!;

    const user = await UserModel.findOne({ id: user_id });
    if (!user) throw new E404(`User ${user_id} is not found`);

    const dubber = await DubberModel.findOne({ id: dubber_id });
    if (!dubber) throw new E404(`Dubber ${dubber_id} is not found`);

    const dubberService = new DubberService({ dubber });
    await dubberService.addMember(user_id);

    return res.status(200).json({
      message: `Invite to the ${dubber_id} dubber team accepted`
    });
  });
}

export async function inviteDecline(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { dubber_id } = req.body as { dubber_id: string };
    const { id: user_id } = req.nekomi.user!;

    const user = await UserModel.findOne({ id: user_id });
    if (!user) throw new E404(`User ${user_id} is not found`);

    const dubber = await DubberModel.findOne({ id: dubber_id });
    if (!dubber) throw new E404(`Dubber ${dubber_id} is not found`);

    const dubberService = new DubberService({ dubber });
    await dubberService.removeMember(user_id, true);

    return res.status(200).json({
      message: `Invite to the ${dubber_id} dubber team declined`
    });
  });
}



export async function settingsMemberExclude(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { user_id, dubber_id } = req.body as { user_id: string, dubber_id: string };

    const user = await UserModel.findOne({ id: user_id });
    if (!user) throw new E404(`User ${user_id} is not found`);

    const dubber = await DubberModel.findOne({ id: dubber_id });
    if (!dubber) throw new E404(`Dubber ${dubber_id} is not found`);

    const dubberService = new DubberService({ dubber });
    await dubberService.removeMember(user_id);

    return res.status(200).json({
      message: `User ${user_id} removed from the ${dubber_id} dubber team`
    });
  });
}