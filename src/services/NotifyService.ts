import { AxiosError } from 'axios';
import Title from '../Models/Title';
import User from '../Models/User';
import { ITitle } from '../interfaces/Title';
import * as dto from '../handlers/dtos';
import Dubber from '../Models/Dubber';
import { IDubber } from '../interfaces/Dubber';
import { $http } from '../handlers/http';
import { config } from '../config';
import { Logger } from '..';
import { E404, ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from './ErrorService';

//! MUST BE SYNCED WITH animee-bot 
export type TNotifyEvent = 'new_episode';

export interface INotifyNewEpisode {
  titleID: string
  dubberID: string
  episodeOrder: number
}

//! MUST BE SYNCED WITH animee-bot 
interface INotifyNewEpisodeBroadcast {
  event: TNotifyEvent
  title: ITitle
  dubber: IDubber
  episodeOrder: number
  users: number[]
}



export class NotifyService {
  async broadcast(event: TNotifyEvent, payload: string) {
    try {
      switch (event) {
        case 'new_episode': {
          await newEpisode(payload);
          break;
        }
      }
    } catch (e) {
      if (e instanceof HTTPErrorConstructor) {
        Logger.error(`[Notify/HTTP]: An error occured while processing ${event}: ${e.code} - ${e.message}`);
      } else if (e instanceof AxiosError) {
        Logger.error(`[Notify/Axios]: An error occured while processing ${event}: ${e.code}`, e);
      } else {
        Logger.error(`[Notify]: An uncaught error occured while processing ${event}`, e);
      }
    }
  }
}

async function newEpisode(payload: string) {
  const event: TNotifyEvent = 'new_episode';
  // @ts-ignore
  let data: INotifyNewEpisode = {};

  try {
    data = JSON.parse(payload) as INotifyNewEpisode;
  } catch (e) {
    throw new ERR_INVALID_PAYLOAD('JSON parsing error');
  }

  const { dubberID, episodeOrder, titleID } = data;

  const title = await Title.findOne({ id: titleID });
  const dubber = await Dubber.findOne({ id: dubberID });

  if (!title) throw new E404(`Title ${titleID} is not found`);
  if (!dubber) throw new E404(`Dubber ${dubberID} is not found`);

  const users = (await User.find({ subscribes: `${event}/${title.id}` })).filter(el => el.statistics.isTelegramLinked && el.watchProgress.some(el => el.dubberID === dubberID && el.titleID === title.id));
  const broadcastPayload: INotifyNewEpisodeBroadcast = {
    title: dto.title(title.toObject()),
    dubber: dto.dubber(dubber.toObject()),
    users: users.map(el => el.telegramData!.id!),
    event,
    episodeOrder,
  };

  await $http.post(`${config.URL.bot}/broadcast`, broadcastPayload);
}