import Logger from '~/services/LoggerService.js';



export default async function runCRONJob(name: string, timeoutMs: number, job: () => Promise<void> | void) {
  await job();

  setInterval(async () => {
    try {
      await job();
    } catch (e) {
      Logger.error(`[runCRONJob/${name}]: An error occured while running CRON job`, e);
    }
  }, timeoutMs);
}