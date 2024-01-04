import { getUTCTime } from '../../handlers/v1/handlers';
import { IStat } from '../../core/interfaces';
import Stats from '../../Models/Stat';
import * as uuid from 'uuid';
import { testMode } from '../../config';

export let dayStat: IStat = {
  id: testMode ? `testid-${uuid.v4()}` : uuid.v4(),
  createdAccounts: 0,
  online: {
    avg: 0,
    peak: 0,
    total: 0
  },
  popularDub: '',
  seriesUploaded: 0,
  titlesCreated: 0,
  titlesUpdated: 0,
  timestamp: 0,
  titles: {
    popularTitle: '',
    popularDub: '',
    top30: [],
    total: []

  },
  totalWatchtimeS: 0
};

let isDayStatSended = false;
updateDayStat();

function updateDayStat() {
  isDayStatSended = true;

  setTimeout(() => {
    isDayStatSended = false;

    dayStat = {
      id: testMode ? `testid-${uuid.v4()}` : uuid.v4(),
      createdAccounts: 0,
      online: {
        avg: 0,
        peak: 0,
        total: 0
      },
      popularDub: '',
      seriesUploaded: 0,
      titlesCreated: 0,
      titlesUpdated: 0,
      timestamp: 0,
      titles: {
        popularTitle: '',
        popularDub: '',
        top30: [],
        total: []

      },
      totalWatchtimeS: 0
    };
  }, 3600000); // 3600000 // 1h
}

export async function sendDayStat() {
  const time = getUTCTime();

  if (new Date(time).getUTCHours() === 23) {
    if (isDayStatSended) return;
  } else return;
  updateDayStat();

  dayStat.online.avg = +(dayStat.online.total / 60).toFixed(2);
  let topDub: { id: string, watchtimeS: number } = {
    id: '',
    watchtimeS: 0
  };

  let topTitle: { id: string, watchtimeS: number } = {
    id: '',
    watchtimeS: 0
  };

  let topTitleDub: { id: string, watchtimeS: number } = {
    id: '',
    watchtimeS: 0
  };

  let totalWatchtimeS = 0;

  dayStat.titles.total.forEach(title => {
    let watchtime = 0;
    title.dubs.forEach(el => watchtime += el.watchtimeS);

    title.watchtimeS = watchtime;
    totalWatchtimeS += watchtime;
  });

  dayStat.titles.top30 = dayStat.titles.total.slice(0, 29);


  dayStat.titles.top30.forEach(el => {
    let tmpWatchtime = 0;

    el.dubs.forEach(dub => {
      tmpWatchtime += dub.watchtimeS;
      if (dub.watchtimeS > topDub.watchtimeS) topDub = dub;
      if (topTitleDub.watchtimeS < dub.watchtimeS) topTitleDub = dub;
    });

    if (topTitle.watchtimeS < tmpWatchtime) topTitle = { id: el.id, watchtimeS: tmpWatchtime };
    el.watchtimeS = tmpWatchtime;
  });

  dayStat.popularDub = topDub.id;
  dayStat.titles.popularTitle = topTitle.id;
  dayStat.titles.popularDub = topTitleDub.id;

  dayStat.totalWatchtimeS = totalWatchtimeS;

  dayStat.timestamp = +new Date(new Date().setUTCHours(23, 0, 0, 0));

  const item = new Stats(dayStat);
  item.save();
}