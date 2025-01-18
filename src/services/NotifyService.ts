import Dubber from '../Models/Dubber';
import NekomiBotAPI from '~/core/Services/API/NekomiBotApi';
import Title from '../Models/Title';
import User from '../Models/User';
import { AxiosError } from 'axios';
import { DevelopmentMode } from '../config';
import { E404, E501, ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from './ErrorService';
import { IEventPayload, INotifyAiringStarted, INotifyDubberInvite, INotifyNewEpisode, NOTIFY_EVENTS, TNotifyBroadcastAiringStarted, TNotifyBroadcastDubberInvite, TNotifyBroadcastNewEpisode, TNotifyEvent } from '../Interfaces/services/Notify';
import { Logger } from './LoggerService';
import { MongoDocumentDTO } from '~/core/Services/DTO';



type TEventFunction = (payload: IEventPayload<any>) => Promise<void>

const EVENTS: { [EVENT in TNotifyEvent]?: TEventFunction } = {
  new_episode,
  airing_started,
  dubber_invite_pending: HANDLER_dubber_tell,
  dubber_invite_accepted: HANDLER_dubber_tell,
  dubber_invite_declined: HANDLER_dubber_tell,
  dubber_member_excluded: HANDLER_dubber_tell,
};



export class NotifyService {
  static createEvent({ event, key }: { event: TNotifyEvent, key: string }) {
    return `${event}/${key}`;
  }

  /** Broadcast notification */
  async broadcast<P = any>(payload: IEventPayload<P>) {
    const event = payload.event;

    if (!NOTIFY_EVENTS.includes(event)) throw new ERR_INVALID_PAYLOAD(`Event ${event} is invalid`);

    const handler = EVENTS[event];
    if (!handler) throw new E501(`Event ${event} is found, but handler for it is not implemented yet`);

    try {
      await handler(payload);
    } catch (e) {
      if (e instanceof HTTPErrorConstructor) {
        Logger.error(`[Notify/HTTP]: An error occured while processing ${event}: ${e.code} - ${e.message}`);
      } else if (e instanceof AxiosError) {
        Logger.error(`[Notify/Axios]: An error occured while processing ${event}: ${e.code}`, e);
        if (DevelopmentMode) console.error(e.response?.data);
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
      title: new MongoDocumentDTO().anime({ document: title }),
      dubber: new MongoDocumentDTO().dubber({ document: dubber }),
      episodeOrder,
    }
  };

  Logger.debug(`[Notify]: Broadcasted ${event} event`);

  await NekomiBotAPI.postBroadcast(broadcastPayload);
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
      title: new MongoDocumentDTO().anime({ document: title })
    }
  };

  Logger.debug(`[Notify]: Broadcasted ${event} event`);

  await NekomiBotAPI.postBroadcast(broadcastPayload);

  users.forEach(async user => {
    user.subscribes = user.subscribes.filter(el => el !== `${event}/${title.id}`);
    await user.save();

    Logger.debug(`[Notify]: User ${event} subscibe removed due to firs fire`);
  });
}

/** Handle dubber_invite accept & decline & invite, dubber_member_exclude */
async function HANDLER_dubber_tell({ event, payload }: IEventPayload<INotifyDubberInvite>) {
  const { dubber_id, user_id } = payload;

  const dubber = await Dubber.findOne({ id: dubber_id });
  if (!dubber) throw new E404(`Dubber ${dubber_id} is not found`);

  const user = await User.findOne({ id: user_id });
  if (!user) throw new E404(`User ${user_id} is not found`);

  const broadcastPayload: TNotifyBroadcastDubberInvite = {
    event,
    participants: [user.telegramData!.id!],
    data: {
      dubber: new MongoDocumentDTO().dubber({ document: dubber })
    }
  };

  Logger.debug(`[Notify]: Broadcasted ${event} event`);

  await NekomiBotAPI.postBroadcast(broadcastPayload);
}

export const Notify = new NotifyService();