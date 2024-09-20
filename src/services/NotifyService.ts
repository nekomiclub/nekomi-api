import { AxiosError } from 'axios';
import Title from '../Models/Title';
import User from '../Models/User';
import { ITitle } from '../interfaces/Title';
import * as dto from '../handlers/dtos';
import Dubber from '../Models/Dubber';
import { IDubber } from '../interfaces/Dubber';
import { $http } from '../handlers/http';
import { config, devMode } from '../config';
import { Logger } from '..';
import { E404, E501, ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from './ErrorService';
import { IEventPayload, INotifyAiringStarted, INotifyNewEpisode, NOTIFY_EVENTS, TNotifyBroadcastAiringStarted, TNotifyBroadcastNewEpisode, TNotifyEvent } from '../interfaces/Notify';

type TEventFunction = (payload: IEventPayload<any>) => Promise<void>

const EVENTS: { [EVENT in TNotifyEvent]?: TEventFunction } = {
  new_episode,
  airing_started,
};



export class NotifyService {
  /** Broadcast notification */
  async broadcast(payload: IEventPayload) {
    const event = payload.event;

    try {
      if (!NOTIFY_EVENTS.includes(event)) throw new ERR_INVALID_PAYLOAD(`Event ${event} is invalid`);

      const handler = EVENTS[event];
      if (!handler) throw new E501(`Event ${event} is found, but handler for it is not implemented yet`);

      await handler(payload);
    } catch (e) {
      if (e instanceof HTTPErrorConstructor) {
        Logger.error(`[Notify/HTTP]: An error occured while processing ${event}: ${e.code} - ${e.message}`);
      } else if (e instanceof AxiosError) {
        Logger.error(`[Notify/Axios]: An error occured while processing ${event}: ${e.code}`, e);
        if (devMode) console.error(e.response?.data);
      } else {
        Logger.error(`[Notify]: An uncaught error occured while processing ${event}`, e);
      }
    }
  }

  /** Test specified event with mocked data */
  async test(event: TNotifyEvent) {
    Logger.debug(`[Notify]: Testing ${event}...`);

    switch (event) {
      case 'new_episode': {
        const title = await Title.findOne({ episodes: { $ne: [] } });

        if (!title) {
          return Logger.fail(`[Notify]: Testing ${event} failed - Title with non empty episodes is not found`);
        }

        const payload: INotifyNewEpisode = {
          titleID: title.id,
          dubberID: title.episodes[0].dubberID,
          episodeOrder: title.episodes[0].order,
        };

        await this.broadcast({ event, payload });

        break;
      }

      case 'airing_started': {
        const title = await Title.findOne();

        if (!title) {
          return Logger.fail(`[Notify]: Testing ${event} failed - Any title is not found`);
        }

        const payload: INotifyAiringStarted = {
          titleID: title.id,
        };

        await this.broadcast({ event, payload });

        break;
      }
    }
  }
}


//* --------------- EVENT HANDLERS

async function new_episode({ event, payload }: IEventPayload<INotifyNewEpisode>) {
  const { dubberID, episodeOrder, titleID } = payload;

  const title = await Title.findOne({ id: titleID });
  if (!title) throw new E404(`Title ${titleID} is not found`);

  const dubber = await Dubber.findOne({ id: dubberID });
  if (!dubber) throw new E404(`Dubber ${dubberID} is not found`);

  if (isNaN(+episodeOrder)) throw new ERR_INVALID_PAYLOAD(`Episode order can not be NaN`);

  const users = (await User.find({ subscribes: `${event}/${title.id}` })).filter(el => el.statistics.isTelegramLinked && el.watchProgress.some(el => el.dubberID === dubberID && el.titleID === title.id));
  const broadcastPayload: TNotifyBroadcastNewEpisode = {
    event,
    participants: users.map(el => el.telegramData!.id!),
    data: {
      title: dto.title(title.toObject()),
      dubber: dto.dubber(dubber.toObject()),
      episodeOrder,
    }
  };

  Logger.debug(`[Notify]: Broadcasted ${event} event`);

  await $http.post(`${config.URL.bot}/broadcast`, broadcastPayload);
}

async function airing_started({ event, payload }: IEventPayload<INotifyAiringStarted>) {
  const { titleID } = payload;

  const title = await Title.findOne({ id: titleID });
  if (!title) throw new E404(`Title ${titleID} is not found`);

  const users = (await User.find({ subscribes: `${event}/${title.id}` })).filter(el => el.statistics.isTelegramLinked);
  const broadcastPayload: TNotifyBroadcastAiringStarted = {
    event,
    participants: users.map(el => el.telegramData!.id!),
    data: {
      title: dto.title(title.toObject())
    }
  };

  Logger.debug(`[Notify]: Broadcasted ${event} event`);

  await $http.post(`${config.URL.bot}/broadcast`, broadcastPayload);
}

export default NotifyService;