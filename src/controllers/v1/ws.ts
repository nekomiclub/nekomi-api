import { IWS, IWSPresence, TWS } from '../../core/IWS';
import { wss } from '../../index';
import { WebSocket } from 'ws';
import { dayStat } from '../../services/v1/stats';

export let onlineSIDs: string[] = [];

export function listenWSS() {
  wss.on('connection', ws => {
    let sid = '';
    let timeout;

    ws.on('error', e => console.error(`WS ERROR: ${JSON.stringify(e)}`));

    ws.on('close', () => {
      if (!sid) return;

      onlineSIDs = onlineSIDs.filter(el => el !== sid);
      broadcast({ type: 'presence', payload: { audience: onlineSIDs.length } });
      clearTimeout(timeout);
    });

    timeout = setTimeout(() => {
      // Add new connection every day
      dayStat.online.total++;
    }, 86400000);

    ws.on('message', data => {
      const message = JSON.parse(data.toString()) as { type: TWS, payload: any };

      if (message.type === 'presence') {
        sid = (message as IWS<IWSPresence>).payload.sid;
        if (!onlineSIDs.some(el => el === sid)) {
          onlineSIDs.push(sid);

          // Add new connection
          dayStat.online.total++;

          if (dayStat.online.peak < onlineSIDs.length) dayStat.online.peak = onlineSIDs.length;
        }

        broadcast({ type: 'presence', payload: { audience: onlineSIDs.length } });
        return;
      } else if (message.type === 'presence/audience') {
        broadcast({ type: 'presence', payload: { audience: onlineSIDs.length } });
        return;
      }

      ws.send(JSON.stringify({ type: 'echo', payload: { message: 'ok' } } as IWS<{ message: string }>));
    });
  });
}

async function broadcast(message: { type: TWS, payload: any }) {
  wss.clients.forEach(ws => {
    if (message.type === 'presence') {
      return ws.send(JSON.stringify({ type: 'presence', payload: { audience: onlineSIDs.length } }));
    }
  });
}