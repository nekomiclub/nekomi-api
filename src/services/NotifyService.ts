import { AxiosError } from 'axios';

import AnimeService from '~/core/services/AnimeService';
import DubberService from '~/core/services/DubberService';
import NekomiBotAPI from '~/core/services/API/NekomiBot.api';
import User, { UserService } from '~/models/User';
import { DevelopmentMode, config } from '~/config';
import { E404, E501, ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from './ErrorService';
import { InlineKeyboardMarkup } from '~/core/interfaces/API/NekomiBotAPI.intf';
import { Logger } from './LoggerService';



export enum NOTIFY_EVENT {
  NEW_EPISODE = 'new_episode',
  AIRING_STARTED = 'airing_started',

  DUBBER_INVITE_PENDING = 'dubber_invite_pending',
  DUBBER_INVITE_ACCEPTED = 'dubber_invite_accepted',
  DUBBER_INVITE_DECLINED = 'dubber_invite_declined',
  DUBBER_MEMBER_EXCLUDED = 'dubber_member_excluded',
}



export interface NotifyEventPayload<P = object> {
  event: NOTIFY_EVENT;
  payload: P;
}

/** new_episode */
export interface NotifyNewEpisodeProps {
  titleID: string;
  dubberID: string;
  episodeOrder: number;
}

/** airing_started */
export interface NotifyAiringStartedProps {
  titleID: string;
}

/** dubber_invite accept & decline & pending, dubber_member_excluded */
export interface NotifyDubberTellProps {
  userId: string;
  dubberId: string;
}


type TEventFunction = (payload: NotifyEventPayload<any>) => Promise<void>

const EVENTS: Record<NOTIFY_EVENT, TEventFunction> = {
  airing_started,
  new_episode,

  dubber_invite_pending: HANDLER_dubber_tell,
  dubber_invite_accepted: HANDLER_dubber_tell,
  dubber_invite_declined: HANDLER_dubber_tell,
  dubber_member_excluded: HANDLER_dubber_tell,
};



export class NotifyService {
  static createEvent({ event, key }: { event: NOTIFY_EVENT, key: string }) {
    return `${event}/${key}`;
  }

  /** Broadcast notification */
  async broadcast<P = any>(payload: NotifyEventPayload<P>) {
    const event = payload.event;

    if (!NOTIFY_EVENT[event]) throw new ERR_INVALID_PAYLOAD(`Event ${event} is invalid`);

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
}


//* --------------- EVENT HANDLERS

async function new_episode({ event, payload }: NotifyEventPayload<NotifyNewEpisodeProps>) {
  const { dubberID, episodeOrder, titleID } = payload;

  const anime = await new AnimeService().getById(titleID, true);

  const dubber = await new DubberService().getById(dubberID);

  const users = (await User.find({
    subscribes: NotifyService.createEvent({ event, key: anime.uuid })
  })).filter(el => el.statistics.isTelegramLinked && el.watchProgress.some(el => el.dubberID === dubberID && el.titleID === anime.uuid));

  const audience = users.map(el => el.telegramData!.id!);


  await NekomiBotAPI.broadcast({
    audience,
    message: `🆕 ${episodeOrder} серія в озвученні ${dubber.nameUkr} завантажена на nekomi.club!\n\n🎬 ${anime.names.ukr} / ${anime.names.eng}\n`,
    photo: anime.poster,
    replyMarkup: {
      inline_keyboard: [[{
        text: 'Дивитись 👉👉👉',
        url: `${config.URL.nekomi_site}/w/${anime.slug}`
      }]]
    }
  });

  Logger.debug(`[Notify]: Broadcasted. [event: ${NotifyService.createEvent({ event, key: anime.uuid })}; audience: ${audience.join(', ')}]`);

}

async function airing_started({ event, payload }: NotifyEventPayload<NotifyAiringStartedProps>) {
  const { titleID } = payload;

  const anime = await new AnimeService().getById(titleID, true);

  const users = (await User.find({ subscribes: NotifyService.createEvent({ event, key: anime.uuid }) })).filter(el => el.statistics.isTelegramLinked);
  const audience = users.map(el => el.telegramData!.id!);

  await NekomiBotAPI.broadcast({
    audience,
    message: `🎉 Почалась трансляція анонсованого аніме!\n\n🎬 ${anime.names.ukr} / ${anime.names.eng}`,
    photo: anime.poster,
    replyMarkup: {
      inline_keyboard: [[{
        text: '📺 Дивитися',
        url: `${config.URL.nekomi_site}/w/${anime.slug}`
      }]]
    }
  });

  users.forEach(async user => {
    const userService = new UserService({ user });
    userService.removeSubscribe({ event, key: anime.uuid });

    await user.save();
  });

  Logger.debug(`[Notify]: Broadcasted. [event: ${NotifyService.createEvent({ event, key: anime.uuid })}; audience: ${audience.join(', ')}]`);
}

/** Handle dubber_invite accept & decline & invite, dubber_member_excluded */
async function HANDLER_dubber_tell({ event, payload }: NotifyEventPayload<NotifyDubberTellProps>) {
  const { dubberId, userId } = payload;

  const dubber = await new DubberService().getById(dubberId);

  const user = await User.findOne({ id: userId });
  if (!user) throw new E404(`User ${userId} is not found`);

  const audience = [user.telegramData!.id!];
  let message = '';
  let replyMarkup: InlineKeyboardMarkup = {
    inline_keyboard: []
  };

  if (event === NOTIFY_EVENT.DUBBER_INVITE_PENDING) {
    message = `👋 Тебе запросили в команду озвучення [${dubber.nameUkr}](${config.URL.nekomi_site}/dub/${dubber.slug}), що відповімо?`;
    replyMarkup = {
      inline_keyboard: [[{
        text: '❌ Утримаюсь',
        url: `${config.URL.nekomi_site}/dub/${dubber.slug}?invite=decline`
      }, {
        text: '✔️ Я в справі',
        url: `${config.URL.nekomi_site}/dub/${dubber.slug}?invite=accept`
      }]]
    };
  } else if (event === NOTIFY_EVENT.DUBBER_INVITE_ACCEPTED) {
    message = `🎉 Тепер ти учасник команди озвучення [${dubber.nameUkr}](${config.URL.nekomi_site}/dub/${dubber.slug}), мої вітання!`;
  } else if (event === NOTIFY_EVENT.DUBBER_INVITE_DECLINED) {
    message = `❌ Ти відхилив запрошення в команду озвучення [${dubber.nameUkr}](${config.URL.nekomi_site}/dub/${dubber.slug}), па-па!`;
  } else if (event === NOTIFY_EVENT.DUBBER_MEMBER_EXCLUDED) {
    message = `😥 Тебе виключили з команди озвучення [${dubber.nameUkr}](${config.URL.nekomi_site}/dub/${dubber.slug}), і таке трапляється...`;
  }

  await NekomiBotAPI.broadcast({
    audience,
    message,
    replyMarkup
  });

  Logger.debug(`[Notify]: Broadcasted. [event: ${NotifyService.createEvent({ event, key: dubber.id })}; audience: ${audience.join(', ')}]`);
}



export const Notify = new NotifyService();