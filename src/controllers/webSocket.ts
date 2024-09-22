import chalk from 'chalk';
import http from 'http';

import { devMode } from '../config';
import { Logger, wss } from '../index';
import { IWS_OnlineChanged, IWS_Route, IWS_SiteConnection, Message, Request, Response, TWS_Request, TWS_Type, WS_TYPES } from '../interfaces/WebSocket';
import { E501, ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from '../services/ErrorService';
import { WebSocket } from 'ws';
import { WebSocketExtended } from '../interfaces/globals';


type TRouterFunction = (message: IWS_Route) => Promise<void>

const ROUTER: { [TYPE in TWS_Request]?: TRouterFunction } = {
  ping,
  site_connected,
  site_disconnected,
};

const OnlineSIDs: string[] = [];



/** Handle websocket requests */
export async function WebsocketRouter(ws: WebSocketExtended, req: http.IncomingMessage) {
  ws.on('message', async message => {
    try {
      const parsed = JSON.parse(message.toString()) as Message;
      const IP = req.headers['cf-connecting-ip'] as string || req.headers['x-forwarded-for'] as string || 'IP_UNDEFINED';

      // Ensure inner data is not undefined
      ws._data = ws._data || {};

      if (!parsed.type || !WS_TYPES.includes(parsed.type) || !parsed.payload) throw new ERR_INVALID_PAYLOAD('Websocket type or payload is invalid');

      const route = ROUTER[parsed.type] as TRouterFunction;
      if (!route) throw new E501(`Route ${parsed.type} is found, but not implemented yet`);

      Logger.trace(`[Request/${IP}]: WebSocket - ${JSON.stringify(parsed)}`);

      await route({ ws, message: parsed });
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

  Logger.info(`[WebSocker]: Site online polling started, current online reseted`);
  OnlineSIDs.splice(0, OnlineSIDs.length - 1);

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

async function site_connected({ ws, message }: IWS_Route) {
  const { payload } = message as Request<IWS_SiteConnection>;

  if (!payload.SID) throw new ERR_INVALID_PAYLOAD('Payload or SID are missing');

  if (!OnlineSIDs.includes(payload.SID)) {
    OnlineSIDs.push(payload.SID);
  } else {
    const response: Response = {
      type: 'ok',
      payload: {
        message: 'Session already stored'
      }
    };

    return ws.send(JSON.stringify(response));
  }

  Logger.debug(`[WebSocket]: New site connection - ${payload.SID}. Current online - ${OnlineSIDs.length}`);

  const response: Response<IWS_OnlineChanged> = {
    type: 'online_changed',
    payload: {
      online: OnlineSIDs.length
    }
  };

  return await broadcast(response);
}

async function site_disconnected({ ws, message }: IWS_Route) {
  const { payload } = message as Request<IWS_SiteConnection>;

  if (!payload.SID) throw new ERR_INVALID_PAYLOAD('Payload or SID are missing');

  const index = OnlineSIDs.findIndex(el => el === payload.SID);

  if (index !== -1) {
    OnlineSIDs.splice(index, 1);
  } else {
    const response: Response = {
      type: 'ok',
      payload: {
        message: 'Session is not stored'
      }
    };

    return ws.send(JSON.stringify(response));
  }

  Logger.debug(`[WebSocket]: Site disconnected - ${payload.SID}. Current online - ${OnlineSIDs.length}`);

  const response: Response<IWS_OnlineChanged> = {
    type: 'online_changed',
    payload: {
      online: OnlineSIDs.length
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