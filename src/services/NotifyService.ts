import { AxiosError } from 'axios';

import DubberService from '~/core/services/DubberService';
import NekomiBotAPI from '~/core/services/API/NekomiBotApi';
import Title from '../models/Title';
import User, { UserModel, UserService } from '../models/User';
import { DevelopmentMode, config } from '../config';
import { E404, E501, ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from './ErrorService';
import { IEventPayload, INotifyAiringStarted, INotifyDubberTell, INotifyNewEpisode, NOTIFY_EVENTS, TNotifyEvent } from '~/interfaces/types';
import { InlineKeyboardMarkup } from '~/core/interfaces/API/NekomiBotAPI.intf';
import { Logger } from './LoggerService';



type TEventFunction = (payload: IEventPayload<any>) => Promise<void>

interface INotifyTestProps {
  telegramId?: number
}

const EVENTS: { [EVENT in TNotifyEvent]?: TEventFunction } = {
  airing_started,
  new_episode,

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
  async test(event: TNotifyEvent, { telegramId }: INotifyTestProps) {
    Logger.debug(`[Notify]: Testing ${event}...`);

    if (event === 'new_episode') {
      const title = await Title.findOne();
      if (!title) return Logger.fail(`[Notify]: Testing ${event} failed - Any title is not found`);

      const payload: INotifyNewEpisode = {
        titleID: title.id,
        dubberID: title.episodes[0].dubberID,
        episodeOrder: title.episodes[0].order,
      };

      await this.broadcast({ event, payload });
    }

    if (event === 'airing_started') {
      const title = await Title.findOne();
      if (!title) return Logger.fail(`[Notify]: Testing ${event} failed - Any title is not found`);

      const payload: INotifyAiringStarted = {
        titleID: title.id,
      };

      await this.broadcast({ event, payload });
    }

    if (
      event === 'dubber_invite_pending'
      || event === 'dubber_invite_accepted'
      || event === 'dubber_invite_declined'
      || event === 'dubber_member_excluded'
    ) {
      if (!telegramId) return Logger.fail(`[Notify]: Can not send notify due to telegramId missing`);

      const user = await UserModel.findOne({ telegramData: { id: telegramId } });
      if (!user) return Logger.fail(`[Notify]: Can not find user with telegram id ${telegramId}`);

      const dubberService = new DubberService();
      const dubber = (await dubberService.getAll())[0];

      const payload: INotifyDubberTell = {
        userId: user.id,
        dubberId: dubber.id
      };

      await this.broadcast({ event, payload });
    }
  }
}


//* --------------- EVENT HANDLERS

async function new_episode({ event, payload }: IEventPayload<INotifyNewEpisode>) {
  const { dubberID, episodeOrder, titleID } = payload;

  const title = await Title.findOne({ id: titleID });
  if (!title) throw new E404(`Title ${titleID} is not found`);

  const dubber = await new DubberService().getById(dubberID);

  const users = (await User.find({
    subscribes: NotifyService.createEvent({ event, key: title.id })
  })).filter(el => el.statistics.isTelegramLinked && el.watchProgress.some(el => el.dubberID === dubberID && el.titleID === title.id));

  const audience = users.map(el => el.telegramData!.id!);


  await NekomiBotAPI.broadcast({
    audience,
    message: `🆕 ${episodeOrder} серія в озвученні ${dubber.nameUkr} завантажена на nekomi.club!\n\n🎬 ${title.names.ukr} / ${title.names.eng}\n`,
    photo: title.poster,
    replyMarkup: {
      inline_keyboard: [[{
        text: 'Дивитись 👉👉👉',
        url: `${config.URL.nekomi_site}/w/${title.code}`
      }]]
    }
  });

  Logger.debug(`[Notify]: Broadcasted. [event: ${NotifyService.createEvent({ event, key: title.id })}; audience: ${audience.join(', ')}]`);

}

async function airing_started({ event, payload }: IEventPayload<INotifyAiringStarted>) {
  const { titleID } = payload;

  const title = await Title.findOne({ id: titleID });
  if (!title) throw new E404(`Title ${titleID} is not found`);

  const users = (await User.find({ subscribes: NotifyService.createEvent({ event, key: title.id }) })).filter(el => el.statistics.isTelegramLinked);
  const audience = users.map(el => el.telegramData!.id!);

  await NekomiBotAPI.broadcast({
    audience,
    message: `🎉 Почалась трансляція анонсованого аніме!\n\n🎬 ${title.names.ukr} / ${title.names.eng}`,
    photo: title.poster,
    replyMarkup: {
      inline_keyboard: [[{
        text: '📺 Дивитися',
        url: `${config.URL.nekomi_site}/w/${title.code}`
      }]]
    }
  });

  users.forEach(async user => {
    const userService = new UserService({ user });
    userService.removeSubscribe({ event, key: title.id });

    await user.save();
  });

  Logger.debug(`[Notify]: Broadcasted. [event: ${NotifyService.createEvent({ event, key: title.id })}; audience: ${audience.join(', ')}]`);
}

/** Handle dubber_invite accept & decline & invite, dubber_member_excluded */
async function HANDLER_dubber_tell({ event, payload }: IEventPayload<INotifyDubberTell>) {
  const { dubberId, userId } = payload;

  const dubber = await new DubberService().getById(dubberId);

  const user = await User.findOne({ id: userId });
  if (!user) throw new E404(`User ${userId} is not found`);

  const audience = [user.telegramData!.id!];
  let message = '';
  let replyMarkup: InlineKeyboardMarkup = {
    inline_keyboard: []
  };

  if (event === 'dubber_invite_pending') {
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
  } else if (event === 'dubber_invite_accepted') {
    message = `🎉 Тепер ти учасник команди озвучення [${dubber.nameUkr}](${config.URL.nekomi_site}/dub/${dubber.slug}), мої вітання!`;
  } else if (event === 'dubber_invite_declined') {
    message = `❌ Ти відхилив запрошення в команду озвучення [${dubber.nameUkr}](${config.URL.nekomi_site}/dub/${dubber.slug}), па-па!`;
  } else if (event === 'dubber_member_excluded') {
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