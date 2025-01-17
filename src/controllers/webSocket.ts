import chalk from 'chalk';
import http from 'http';

import UserModel from '../Models/User';
import validator from 'validator';
import { DevelopmentMode, config } from '../config';
import { E403, E404, E501, ERR_INVALID_PAYLOAD, ERR_LENGTH_INVALID, ERR_MISSING_AUTHORIZATION, HTTPErrorConstructor } from '../services/ErrorService';
import { IWS_OnlineChanged, IWS_Route, IWS_SiteConnection, IWS_WTConnect, IWS_WTMessage, IWS_WTSync, Message, Request, Response, TWS_Group, TWS_Request, TWS_Type, WS_TYPES } from '../interfaces/WebSocket';
import { Logger } from '../services/LoggerService';
import { MiddlewareService } from '../services/MiddlewareService';
import { WebSocketExtended } from '../interfaces/globals';
import { getUTC } from '../handlers/handler';
import { wss } from '../index';



interface IBroadcastProps {
  message: Message
  audience: TWS_Group
}

type TRouterFunction = (message: IWS_Route, IP: string) => Promise<void>

const ROUTER: { [TYPE in TWS_Request]?: TRouterFunction } = {
  ping,

  site_connected,
  site_disconnected,

  wt_connect,
  wt_disconnect,
  wt_message,
  wt_sync,
};

const PRIVATE_ROUTES: TWS_Type[] = [
  'wt_connect',
  'wt_disconnect',
  'wt_message',
  'wt_sync',
];

let OnlineClients: string[] = [];



/** Handle websocket requests */
export async function WebsocketRouter(ws: WebSocketExtended, req: http.IncomingMessage) {
  ws.on('message', async message => {
    try {
      const parsed = JSON.parse(message.toString()) as Message;
      const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || 'IP_UNDEFINED';

      if (!parsed.type || !WS_TYPES.includes(parsed.type) || !parsed.payload || !parsed.CSRF) throw new ERR_INVALID_PAYLOAD();

      // Check CSRF
      const middlewareService = new MiddlewareService();
      await middlewareService.checkCSRF(parsed.CSRF, [config.DOMAIN.nekomi]);

      // Ensure inner data is not undefined
      ws.nekomi = ws.nekomi ?? {
        listener: [],
      };

      const route = ROUTER[parsed.type] as TRouterFunction;
      if (!route) throw new E501(`Route ${parsed.type} is found but not implemented yet`);

      // Check access
      if (PRIVATE_ROUTES.includes(parsed.type)) {
        if (!parsed.Authorization) throw new ERR_MISSING_AUTHORIZATION();

        const { user } = await middlewareService.checkAccess(parsed.Authorization);

        ws.nekomi.user = {
          id: user.id
        };
      }

      Logger.trace(`[Request/${IP}]: WebSocket - ${parsed.type}`);

      await route({ ws, message: parsed }, IP);
    } catch (e) {
      if (e instanceof HTTPErrorConstructor) {
        const emsg = `[WebSocket/${e.status}]: ${e.code} - ${e.message}`;
        if (DevelopmentMode) console.error(chalk.red(emsg));

        if (e.status >= 500) {
          Logger.error(emsg);
        }

        const payload: Response = {
          type: 'error',
          payload: e
        };

        return ws.send(JSON.stringify(payload));
      } else {
        const payload: Response = {
          type: 'error',
          payload: {
            message: `Uncaught websocket error occured`
          }
        };

        Logger.error('[WebSocket]: Uncaught error occured', e);
        return ws.send(JSON.stringify(payload));
      }
    }
  });
}

/** Poll active clients */
export async function WebSocketOnlinePoll() {
  const request: Request = {
    type: 'online_poll',
    payload: {
      message: 'Please, send back site_connected request'
    }
  };

  Logger.info(`[WebSocket]: Site online polling started, current online reseted`);
  OnlineClients.splice(0, OnlineClients.length - 1);

  return await broadcast({
    message: request,
    audience: 'online_poll'
  });
}



//* ----------- ROUTES

async function ping({ ws, message }: IWS_Route) {
  const response: Response = {
    type: 'pong',
    payload: {
      message: 'Pong!'
    }
  };

  return ws.send(JSON.stringify(response));
}

async function site_connected({ ws, message }: IWS_Route, IP: string) {
  const { payload } = message as Request<IWS_SiteConnection>;
  const id = IP !== 'IP_UNDEFINED' ? IP : payload.SID;

  if (!payload.SID) throw new ERR_INVALID_PAYLOAD('SID is missing');

  if (!OnlineClients.includes(id)) {
    OnlineClients.push(id);
  } else {
    if (!DevelopmentMode) return;

    const response: Response = {
      type: 'ok',
      payload: {
        message: 'Session already stored'
      }
    };

    return ws.send(JSON.stringify(response));
  }

  Logger.debug(`[WebSocket]: New site connection - ${id}. Current online - ${OnlineClients.length}`);

  const response: Response<IWS_OnlineChanged> = {
    type: 'online_changed',
    payload: {
      online: OnlineClients.length
    }
  };

  ws.nekomi.listener.push('online_poll');

  return await broadcast({
    message: response,
    audience: 'online_poll'
  });
}

async function site_disconnected({ ws, message }: IWS_Route, IP: string) {
  const { payload } = message as Request<IWS_SiteConnection>;
  const id = IP !== 'IP_UNDEFINED' ? IP : payload.SID;

  if (!id) throw new ERR_INVALID_PAYLOAD('SID is missing');

  if (OnlineClients.some(el => el === IP || el === payload.SID)) {
    OnlineClients = OnlineClients.filter(el => el !== IP && el !== payload.SID);
  } else {
    if (!DevelopmentMode) return;

    const response: Response = {
      type: 'ok',
      payload: {
        message: 'Session is not stored'
      }
    };

    return ws.send(JSON.stringify(response));
  }

  Logger.debug(`[WebSocket]: Site disconnected - ${id}. Current online - ${OnlineClients.length}`);

  const response: Response<IWS_OnlineChanged> = {
    type: 'online_changed',
    payload: {
      online: OnlineClients.length
    }
  };

  ws.nekomi.listener = ws.nekomi.listener.filter(el => el !== 'online_poll');

  return await broadcast({
    message: response,
    audience: 'online_poll'
  });
}



async function wt_connect({ ws, message }: IWS_Route) {
  const { username, roomId } = message.payload as IWS_WTConnect;
  if (!username || !roomId) throw new ERR_INVALID_PAYLOAD();
  if (username.length > config.VALIDATION.CreateUser.maxNameLength) throw new ERR_LENGTH_INVALID();

  const ownerId = roomId.split('__')[0];
  const wtRoomId = roomId.split('__')[1];

  const user = await UserModel.findOne({ id: ownerId });
  if (!user) throw new E404(`User ${ownerId} is not found`);

  const room = user.togetherRooms.find(el => el.id === wtRoomId);
  if (!room) throw new E404(`Room ${wtRoomId} is not found`);

  ws.nekomi.wt = {
    ownerId: ownerId,
    roomId: wtRoomId,
    settings: room.settings,
  };
  ws.nekomi.listener.push('watch_together');

  Logger.info(`[Websocket/WT-${roomId}]: User ${username} connected`);

  const response: Response<IWS_WTMessage> = {
    payload: {
      avatar: config.vars.defaultAvatar,
      date: getUTC().timestamp,
      roomId,
      text: `${username} доєднався до кімнати`,
      type: 'system',
      username: 'SYSTEM'
    },
    type: 'wt_message'
  };

  return await broadcast({
    message: response,
    audience: 'watch_together'
  });
}

async function wt_disconnect({ ws, message }: IWS_Route) {
  const { username, roomId } = message.payload as IWS_WTConnect;
  if (!username || !roomId) throw new ERR_INVALID_PAYLOAD();

  ws.nekomi.wt = undefined;
  ws.nekomi.listener = ws.nekomi.listener.filter(el => el !== 'watch_together');

  Logger.info(`[Websocket/WT-${roomId}]: User ${username} disconnected`);

  const response: Response<IWS_WTMessage> = {
    payload: {
      avatar: config.vars.defaultAvatar,
      date: getUTC().timestamp,
      roomId,
      text: `${username} вийшов з кімнати`,
      type: 'system',
      username: 'SYSTEM'
    },
    type: 'wt_message'
  };

  return await broadcast({
    message: response,
    audience: 'watch_together'
  });
}

async function wt_message({ ws, message }: IWS_Route) {
  const { username, roomId, avatar, date, text, type } = message.payload as IWS_WTMessage;

  let xssAttemp = false;

  if (!validator.isLength(text, { min: 1, max: config.VALIDATION.WatchTogether.textMessageLength })) throw new ERR_LENGTH_INVALID();
  if (text.includes('<script')) xssAttemp = true;

  Logger.debug(`[Websocket/WT-${roomId}]: ${username}: ${text}`);

  const response: Response<IWS_WTMessage> = {
    payload: {
      avatar,
      date: getUTC().timestamp,
      roomId,
      text: xssAttemp ? `${username}, ти справді думаєш, що вставивши script в повідомлення зробиш XSS атаку? :)` : text,
      type: xssAttemp ? 'system' : 'income',
      username: xssAttemp ? 'SYSTEM' : username
    },
    type: 'wt_message'
  };

  return await broadcast({
    message: response,
    audience: 'watch_together'
  });
}

async function wt_sync({ ws, message }: IWS_Route) {
  const { dubberId, isBuffering, isPlaying, moment, order, roomId, syncedWithId } = message.payload as IWS_WTSync;
  if (!dubberId || !roomId || !syncedWithId || isBuffering === undefined || isPlaying === undefined || order === undefined || moment === undefined) throw new ERR_INVALID_PAYLOAD();

  Logger.debug(`[Websocket/WT-${roomId}]: Progress synced`);

  if (ws.nekomi.user?.id !== ws.nekomi.wt?.ownerId && !ws.nekomi.wt?.settings.usersCanControl) throw new E403('User can not sync progress');

  const response: Response<IWS_WTSync> = {
    type: 'wt_sync',
    payload: message.payload as IWS_WTSync
  };

  return await broadcast({
    message: response,
    audience: 'watch_together',
  });
}



//* ----------- HANDLERS

/** Broadcast message to all websocket clients */
async function broadcast({ message, audience }: IBroadcastProps) {
  const clients = wss.clients as Set<WebSocketExtended>;

  Logger.debug(`[WebSocket]: Broadcasted type ${message.type} to ${audience} audience`);

  clients.forEach(client => {
    if (!client.nekomi || !client.nekomi.listener.includes(audience)) return;

    if (audience === 'watch_together') {
      const { payload } = message as Response<IWS_WTMessage>;
      if (client.nekomi.wt?.roomId !== payload.roomId.split('__')[1]) return;

      return client.send(JSON.stringify(message));
    }

    return client.send(JSON.stringify(message));
  });
}