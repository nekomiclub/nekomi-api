import { AxiosError } from 'axios';
import { E400, E404, ErrorConstructor, writeLog } from '../handlers/Errors';
import Title from '../Models/Title';
import User from '../Models/User';
import { ITitle } from '../interfaces/Title';
import * as dto from '../handlers/dtos';
import Dubbers from '../Models/Dubber';
import { IDubber } from '../interfaces/Dubber';
import { $http } from '../handlers/http';
import { config } from '../config';

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
      if (e instanceof ErrorConstructor) {
        writeLog('error', `[HTTP_ERR at ${event}]: ${e.code} - ${e.msg}`, 'NotifyService');
      } else if (e instanceof AxiosError) {
        writeLog('error', `[AXIOS_ERR at ${event}]: ${e.code} - ${JSON.stringify(e.response?.data)}`, 'NotifyService');
      } else {
        writeLog('error', `[UNKNOWN at ${event}]: ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`, 'NotifyService');
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
    throw new E400('JSON parsing error');
  }

  const { dubberID, episodeOrder, titleID } = data;

  const title = await Title.findOne({ id: titleID });
  const dubber = await Dubbers.findOne({ id: dubberID });

  if (!title) throw new E404(`Title ${titleID} is not found`);
  if (!dubber) throw new E404(`Dubber ${dubberID} is not found`);

  const users = (await User.find({ subscribes: `${event}/${title.id}` })).filter(el => el.statistics.isTelegramLinked);
  const broadcastPayload: INotifyNewEpisodeBroadcast = {
    title: dto.title(title.toObject()),
    dubber: dto.dubber(dubber.toObject()),
    users: users.map(el => el.telegramData!.id!),
    event,
    episodeOrder,
  };

  await $http.post(`${config.URL.bot}/broadcast`, broadcastPayload);
}