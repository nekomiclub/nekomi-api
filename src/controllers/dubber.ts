import * as dto from '../handlers/dtos';
import Dubber, { DubberModel, DubberService } from '../Models/Dubber';
import UserModel from '../Models/User';
import express from 'express';
import { E404, ERR_MIDDLEWARE_REQUIRED, HandleRequest } from '../services/ErrorService';
import { TDubberMemberRole } from '~/core/interfaces/IDubber';



export async function getAll(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    const dubbers = await Dubber.find();

    return res.status(200).json({ message: 'ok', dubbers: dubbers.map(dubber => dto.dubber(dubber.toObject())) });
  });
}


export async function settingsMemberEdit(req: express.Request, res: express.Response) {
  await HandleRequest(req, res, async () => {
    if (!req.nekomi.middlewaresPassed?.includes('checkAccess')) throw new ERR_MIDDLEWARE_REQUIRED(`checkAccess`);
    if (!req.nekomi.middlewaresPassed?.includes('checkCSRF')) throw new ERR_MIDDLEWARE_REQUIRED(`checkCSRF`);

    const { user_id, dubber_id, role } = req.body as { user_id: string, dubber_id: string, role?: TDubberMemberRole };

    const user = await UserModel.findOne({ id: user_id });
    if (!user) throw new E404(`User ${user_id} is not found`);

    const dubber = await DubberModel.findOne({ id: dubber_id });
    if (!dubber) throw new E404(`Dubber ${dubber_id} is not found`);

    const dubberService = new DubberService({ dubber });

    if (role !== undefined) {
      await dubberService.editMember({ id: user_id, role });
    }

    await dubberService.save();

    return res.status(200).json({
      message: `User ${user_id} patched`
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