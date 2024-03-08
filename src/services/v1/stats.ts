import { getUTC } from '../../handlers/v1/handlers';
import { IStat } from '../../core/interfaces';
import Stats from '../../Models/Stat';
import { testMode } from '../../config';

let statSended = false;

const defaultDayStat: IStat = {
  online: {
    avg: 0,
    max: 0,
    total: 0,
    min: 0
  },
  seriesUploaded: 0,
  titlesUpdated: 0,
  timestamp: getUTC().timestamp,
  titles: [],
};

export const DAY_STAT: IStat = JSON.parse(JSON.stringify(defaultDayStat));

export async function sendDayStat() {
  const isTimeToSend = getUTC().hrs === 2;

  if (isTimeToSend && !statSended) {
    statSended = true;

    DAY_STAT.online.avg = Math.round((DAY_STAT.online.max + DAY_STAT.online.min) / 24);
    DAY_STAT.timestamp = getUTC().timestamp

    const stat = new Stats(DAY_STAT);
    await stat.save();

    for (const i in DAY_STAT) {
      DAY_STAT[i] = defaultDayStat[i];
    }

    DAY_STAT.timestamp = getUTC().timestamp
  } else if (!isTimeToSend && statSended) {
    statSended = false;
  }

  setTimeout(() => {
    sendDayStat();
  }, 1200000); // 1200000 // 20m
}