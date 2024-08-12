import { devMode } from '../config';
import { E400, ErrorConstructor, writeLog } from '../handlers/Errors';
import { wss } from '../index';
import { IWS, IWSPollPresence, IWSSendPresence, TWSType } from '../interfaces/WebSocket';

let OnlineSIDs: string[] = [];

export function WebSocketListen() {
  wss.on('connection', ws => {
    ws.on('message', message => {
      try {
        const data = JSON.parse(message.toString()) as IWS;

        if (data.type === 'send_presence') {
          const { payload } = data as IWS<IWSSendPresence>;

          if (!payload.SID) throw new E400('SID is not provided');

          if (!OnlineSIDs.includes(payload.SID)) OnlineSIDs.push(payload.SID);

          const response: IWS<IWSPollPresence> = {
            type: 'poll_presence',
            payload: {
              online: OnlineSIDs.length
            }
          };

          ws.send(JSON.stringify(response));
        } else if (data.type === 'disconnect_presence') {
          const { payload } = data as IWS<IWSSendPresence>;

          if (!payload.SID) throw new E400('SID is not provided');

          OnlineSIDs = OnlineSIDs.filter(el => el !== payload.SID);
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
        if (e instanceof ErrorConstructor) {
          const emsg = `[WS ${e.code}]: ${e.msg}`;
          if (devMode) console.error(emsg);

          if (e.code >= 500) {
            writeLog('error', emsg, 'catchError/WS');
          }

          const payload: IWS = {
            type: 'error',
            payload: e
          };

          return ws.send(JSON.stringify(payload));
        } else {
          writeLog('error', e, 'webSocket');
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