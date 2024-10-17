import chalk from 'chalk';
import http from 'http';

import { devMode, prodMode } from '../config';
import { wss } from '../index';
import { IWS_OnlineChanged, IWS_Route, IWS_SiteConnection, Message, Request, Response, TWS_Request, TWS_Type, WS_TYPES } from '../interfaces/WebSocket';
import { E501, ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from '../services/ErrorService';
import { WebSocketExtended } from '../interfaces/globals';
import { Logger } from '../services/LoggerService';


type TRouterFunction = (message: IWS_Route, IP: string) => Promise<void>

const ROUTER: { [TYPE in TWS_Request]?: TRouterFunction } = {
  ping,
  site_connected,
  site_disconnected,
};

let OnlineClients: string[] = [];



/** Handle websocket requests */
export async function WebsocketRouter(ws: WebSocketExtended, req: http.IncomingMessage) {
  ws.on('message', async message => {
    try {
      const parsed = JSON.parse(message.toString()) as Message;
      const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || 'IP_UNDEFINED';

      // Ensure inner data is not undefined
      ws.animee = ws.animee !== undefined ? ws.animee : {};

      if (!parsed.type || !WS_TYPES.includes(parsed.type) || !parsed.payload) throw new ERR_INVALID_PAYLOAD('Websocket type or payload is invalid');

      const route = ROUTER[parsed.type] as TRouterFunction;
      if (!route) throw new E501(`Route ${parsed.type} is found but not implemented yet`);

      Logger.trace(`[Request/${IP}]: WebSocket - ${JSON.stringify(parsed)}`);

      await route({ ws, message: parsed }, IP);
    } catch (e) {
      if (e instanceof HTTPErrorConstructor) {
        const emsg = `[WebSocket/${e.status}]: ${e.code} - ${e.message}`;
        if (devMode) console.error(chalk.red(emsg));

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

  return await broadcast(request);
}



//* ----------- ROUTES

async function ping({ ws, message }: IWS_Route) {
  const response: Response = {
    type: 'pong',
    payload: {
      message: 'Pong!'
    }
  };

  ws.send(JSON.stringify(response));
}

async function site_connected({ ws, message }: IWS_Route, IP: string) {
  const { payload } = message as Request<IWS_SiteConnection>;
  const id = IP !== 'IP_UNDEFINED' ? IP : payload.SID;

  if (!payload.SID) throw new ERR_INVALID_PAYLOAD('SID is missing');

  if (!OnlineClients.includes(id)) {
    OnlineClients.push(id);
  } else {
    if (!devMode) return;

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

  return await broadcast(response);
}

async function site_disconnected({ ws, message }: IWS_Route, IP: string) {
  const { payload } = message as Request<IWS_SiteConnection>;
  const id = IP !== 'IP_UNDEFINED' ? IP : payload.SID;

  if (!id) throw new ERR_INVALID_PAYLOAD('SID is missing');

  if (OnlineClients.some(el => el === IP || el === payload.SID)) {
    OnlineClients = OnlineClients.filter(el => el !== IP && el !== payload.SID);
  } else {
    if (!devMode) return;

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

  return await broadcast(response);
}



//* ----------- HANDLERS

/** Broadcast message to all websocket clients */
async function broadcast(message: Message) {
  Logger.debug(`[WebSocket]: Broadcasted - ${JSON.stringify(message)}`);

  wss.clients.forEach(ws => {
    return ws.send(JSON.stringify(message));
  });
}