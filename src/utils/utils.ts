/** Get UTC date
 * @param timestamp Timestamp to start from. Default - now
 */
export function getUTC(timestamp?: number | string | null): {
  year: number
  /** January is first month, december is 12 */
  month: number
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
} {
  const now = timestamp ? new Date(timestamp) : new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const date = String(now.getUTCDate()).padStart(2, '0');
  const weekDay = now.getUTCDay();
  const hrs = String(now.getUTCHours()).padStart(2, '0');
  const mins = String(now.getUTCMinutes()).padStart(2, '0');
  const secs = String(now.getUTCSeconds()).padStart(2, '0');
  const ms = String(now.getUTCMilliseconds()).padStart(4, '0');

  return {
    year,
    month: +month,
    date: +date,
    weekDay,
    hrs: +hrs,
    mins: +mins,
    secs: +secs,
    ms: +ms,
    timestamp: now.getTime(),
    fulldate: `${date}.${month}.${year}`,
    time: `${hrs}:${mins}`,
    timeAccurate: `${hrs}:${mins}:${secs}.${ms}`,
  };
}