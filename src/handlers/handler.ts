import * as uuid from 'uuid';

import ip from 'ip';

interface IGetNewUTC {
  year: number
  /** Human readable format (Jan is 1) */
  month: number
  /** Machine (Jan is 0) */
  monthUTC: number
  date: number
  weekDay: number
  hrs: number
  mins: number
  secs: number
  ms: number
  timestamp: number
  /** Time
   * @returns 'hh:mm'
   */
  time: string
  /** Accurate time
   * @returns 'hh:mm:ss.mss'
   */
  timeAccurate: string
  /** European fulldate
   * @returns 'dd.mm.yyyy'
   */
  fulldate: string
  /** American fulldate
   * @returns 'yyyy.mm.dd'
   */
  fulldateAmerican: string
}

/** Return current IPv4 if raw match 0.0.0.0 */
export function preserveIP(raw: string): string {
  if (raw === '0.0.0.0') {
    return ip.address();
  } else {
    return raw;
  }
}

/** Create UUID v4 id */
export function createID(): string {
  return uuid.v4();
}

export function createStringID(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

/** Get random number in range */
export function randomNumber(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

/** Turn number to string & add zero before number if it less than 10 */
export function addZeroIfNumberSingle(num: number): string {
  return num <= 9 ? `0${num}` : `${num}`;
}

/** Get UTC date
 * @param timestamp Timestamp to start from. Default - now
 */
export function getUTC(timestamp?: number | null): IGetNewUTC {
  const now = timestamp ? new Date(timestamp) : new Date();

  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    monthUTC: now.getUTCMonth(),
    date: now.getUTCDate(),
    weekDay: now.getUTCDay(),
    hrs: now.getUTCHours(),
    mins: now.getUTCMinutes(),
    secs: now.getUTCSeconds(),
    ms: now.getUTCMilliseconds(),
    timestamp: now.getTime(),
    fulldate: `${addZeroIfNumberSingle(now.getUTCDate())}.${addZeroIfNumberSingle(now.getUTCMonth() + 1)}.${now.getUTCFullYear()}`,
    fulldateAmerican: `${now.getUTCFullYear()}.${addZeroIfNumberSingle(now.getUTCMonth() + 1)}.${addZeroIfNumberSingle(now.getUTCDate())}`,
    time: `${addZeroIfNumberSingle(now.getUTCHours())}:${addZeroIfNumberSingle(now.getUTCMinutes())}`,
    timeAccurate: `${addZeroIfNumberSingle(now.getUTCHours())}:${addZeroIfNumberSingle(now.getUTCMinutes())}:${addZeroIfNumberSingle(now.getUTCMinutes())}.${now.getMilliseconds() < 100 ? `0${addZeroIfNumberSingle(now.getMilliseconds())}` : addZeroIfNumberSingle(now.getMilliseconds())}`,
  };
}

/** Parse WEK, MON MM, YYYY */
export function parseIMDBDate(dateString: string): number {
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const dateParts = dateString.split(' ');

  const day = parseInt(dateParts[2]);
  const month = months[dateParts[1]];
  const year = parseInt(dateParts[3]);


  return +new Date(year, month, day);
}

// export async function parseTitles() {
//   const startedAt = getUTC().timestamp;
//   const titles = JSON.parse(fs.readFileSync(`${path.resolve()}/src/titles.json`).toString()).titles as ITitle[];

//   console.log(`Titles parsing started`);

//   for (const key in titles) {
//     const title = titles[key];

//     await createTitle('ROOT_MAL_PARSING', title);
//   }

//   console.log(`Titles parsing ended within ${((getUTC().timestamp - startedAt) / 1000).toFixed(2)} with pushed ${titles.length} titles`);
// }