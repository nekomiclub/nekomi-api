import chalk from 'chalk';
import { devMode } from '../config';
import { Logger, wss } from '../index';
import { IWS, IWSPollPresence, IWSSendPresence, TWSType } from '../interfaces/WebSocket';
import { ERR_INVALID_PAYLOAD, HTTPErrorConstructor } from '../services/ErrorService';

let OnlineSIDs: string[] = [];

export function WebSocketListen() {
  wss.on('connection', ws => {
    ws.on('message', message => {
      try {
        const data = JSON.parse(message.toString()) as IWS;

        if (data.type === 'send_presence') {
          const { payload } = data as IWS<IWSSendPresence>;

          if (!payload || !payload.SID) throw new ERR_INVALID_PAYLOAD();

          if (!OnlineSIDs.includes(payload.SID)) OnlineSIDs.push(payload.SID);

          const response: IWS<IWSPollPresence> = {
            type: 'poll_presence',
            payload: {
              online: OnlineSIDs.length
            }
          };

          ws.send(JSON.stringify(response));
          Logger.info(`[WebSocket]: New site connection - ${payload.SID}. Current online - ${OnlineSIDs.length}`);
        } else if (data.type === 'disconnect_presence') {
          const { payload } = data as IWS<IWSSendPresence>;

          if (!payload || !payload.SID) throw new ERR_INVALID_PAYLOAD();

          OnlineSIDs = OnlineSIDs.filter(el => el !== payload.SID);
          Logger.info(`[WebSocket]: Site disconnect - ${payload.SID}. Current online - ${OnlineSIDs.length}`);
        }

        // Broadcats new SIDs count
        if (data.type === 'send_presence' || data.type === 'disconnect_presence') {
          const pollPayload: IWS<IWSPollPresence> = {
            type: 'poll_presence',
            payload: {
              online: OnlineSIDs.length
            }
          };

          broadcast(pollPayload);
        }
      } catch (e) {
        if (e instanceof HTTPErrorConstructor) {
          const emsg = `[WebSocket/${e.status}]: ${e.code} - ${e.message}`;
          if (devMode) console.error(chalk.red(emsg));

          if (e.status >= 500) {
            Logger.error(emsg);
          }

          const payload: IWS = {
            type: 'error',
            payload: e
          };

          return ws.send(JSON.stringify(payload));
        } else {
          const payload: IWS = {
            type: 'error',
            payload: `Uncaught websocket error occured`
          };

          Logger.error('[WebSocket]: Uncaught error occured', e);
          return ws.send(JSON.stringify(payload));
        }
      }
    });
  });
}

async function broadcast(message: IWS) {
  wss.clients.forEach(ws => {
    if (message.type === 'poll_presence') {
      return ws.send(JSON.stringify(message));
    }
  });
}