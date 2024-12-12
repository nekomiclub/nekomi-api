import * as dto from '../handlers/dtos';
import Dubber from '../Models/Dubber';
import Title from '../Models/Title';
import User from '../Models/User';
import { $http } from '../handlers/http';
import { AxiosError } from 'axios';
import { E404, E501, ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from './ErrorService';
import { IEventPayload, INotifyAiringStarted, INotifyDubberInvite, INotifyNewEpisode, NOTIFY_EVENTS, TNotifyBroadcastAiringStarted, TNotifyBroadcastDubberInvite, TNotifyBroadcastNewEpisode, TNotifyEvent } from '../interfaces/services/Notify';
import { Logger } from './LoggerService';
import { NEKOMI_BOT } from '../interfaces/http/Bot';
import { devMode } from '../config';

type TEventFunction = (payload: IEventPayload<any>) => Promise<void>

const EVENTS: { [EVENT in TNotifyEvent]?: TEventFunction } = {
  new_episode,
  airing_started,
  dubber_invite_pending,
  dubber_invite_accepted: dubber_invite_pending,
  dubber_invite_declined: dubber_invite_pending,
  dubber_member_excluded: dubber_invite_pending,
};



export class NotifyService {
  static createEvent({ event, key }: { event: TNotifyEvent, key: string }) {
    return `${event}/${key}`;
  }

  /** Broadcast notification */
  async broadcast<P = any>(payload: IEventPayload<P>) {
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

  await $http.post(NEKOMI_BOT.broadcast, broadcastPayload);
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

  await $http.post(NEKOMI_BOT.broadcast, broadcastPayload);

  users.forEach(async user => {
    user.subscribes = user.subscribes.filter(el => el !== `${event}/${title.id}`);
    await user.save();

    Logger.debug(`[Notify]: User ${event} subscibe removed due to firs fire`);
  });
}

async function dubber_invite_pending({ event, payload }: IEventPayload<INotifyDubberInvite>) {
  const { dubber_id, user_id } = payload;

  const dubber = await Dubber.findOne({ id: dubber_id });
  if (!dubber) throw new E404(`Dubber ${dubber_id} is not found`);

  const user = await User.findOne({ id: user_id });
  if (!user) throw new E404(`User ${user_id} is not found`);

  const broadcastPayload: TNotifyBroadcastDubberInvite = {
    event,
    participants: [user.telegramData!.id!],
    data: {
      dubber: dto.dubber(dubber.toObject())
    }
  };

  Logger.debug(`[Notify]: Broadcasted ${event} event`);

  await $http.post(NEKOMI_BOT.broadcast, broadcastPayload);
}

export const Notify = new NotifyService();