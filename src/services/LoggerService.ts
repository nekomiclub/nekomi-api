import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { TestMode, config } from '~/config';
import { getUTC } from '~/utils/utils';




export const LOG_TYPES = ['info', 'warn', 'error', 'fail', 'debug', 'trace', 'suspicious'] as const;
export type TLogType = typeof LOG_TYPES[number];



/** Logging service */
class LoggerService {
  private MAX_TYPE_LENGTH = Math.max(...LOG_TYPES.map(el => el.length));

  private LOG_FOLDER = config.env.ISDOCKER ? '/logs' : `${path.resolve()}/logs`;
  private LOG_DUMP_FOLDER = `${this.LOG_FOLDER}/.dumps`;

  private LOG_FILE = `${this.LOG_FOLDER}/latest.log`;
  private LOG_ERROR_FILE = `${this.LOG_FOLDER}/error.log`;
  private LOG_SUSPICIOUS_FILE = `${this.LOG_FOLDER}/suspicious.log`;
  private LOG_FILE_MAX_ROWS = 30000;



  constructor() {
    this.checkFilesystem();

    console.clear();
    this.debug(`[Startup]: ------------------ DRY RUN ------------------`);
  }



  /** Write log */
  private append({ msg, type, e }: { type: TLogType, msg: string, e?: any }) {
    const emsg = e?.msg || e?.message || e?.data?.message || e?.data?.msg || e?.response?.data?.message || e?.response?.data?.message;
    const date = `${getUTC().fulldate}/${getUTC().timeAccurate}`;
    const parsedType = `${type.toUpperCase()}${[...Array(this.MAX_TYPE_LENGTH - type.length + 1).keys()].map(el => null).join(' ')}`;

    const logMessage = `${msg}.${e !== undefined ? ` ${emsg ? `EMSG - ${emsg}` : `Stack - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`}` : ''}`;
    const log = `${parsedType} (${date}) | ${logMessage}`;

    this.prepend(log, this.LOG_FILE);

    if (type === 'error' || type === 'fail') {
      this.prepend(log, this.LOG_ERROR_FILE);
      if (!TestMode) console.log(chalk.red(`${parsedType} | ${logMessage}`));
    } else if (type === 'info') {
      if (!TestMode) console.log(chalk.green(`${parsedType} | ${logMessage}`));
    } else if (type === 'debug' || type === 'trace') {
      if (!TestMode) console.debug(chalk.grey(`${parsedType} | ${logMessage}`));
    } else if (type === 'warn') {
      if (!TestMode) console.log(chalk.yellow(`${parsedType} | ${logMessage}`));
    } else if (type === 'suspicious') {
      null;
    } else {
      if (!TestMode) console.log(`${chalk.bgRed(`(TYPE NOT SPECIFIED IN LOGGER SERVICE)`)} ${parsedType} | ${logMessage}`);
    }

    if (type === 'suspicious') {
      this.prepend(log, this.LOG_SUSPICIOUS_FILE);
      if (!TestMode) console.log(`${chalk.bgHex('#e74c3c').black('SUSPICIOUS')} ${chalk.yellow(`| ${logMessage}`)}`);
    }
  }



  /** Business logic, general information */
  info(msg: string) {
    this.append({
      type: 'info',
      msg
    });
  }

  /** Warns */
  warn(msg: string) {
    this.append({
      type: 'warn',
      msg
    });
  }

  /** Errors */
  error(msg: string, e?: any) {
    this.append({
      type: 'error',
      msg,
      e
    });
  }

  /** Process fail */
  fail(msg: string, e?: any) {
    this.append({
      type: 'fail',
      msg,
      e
    });
  }

  /** Tech details */
  debug(msg: string) {
    this.append({
      type: 'debug',
      msg
    });
  }

  /** Trace request */
  trace(msg: string) {
    this.append({
      type: 'trace',
      msg
    });
  }

  /** Write suspicious activity */
  suspicious(msg: string) {
    this.append({
      type: 'suspicious',
      msg
    });
  }

  /** Fire all log events */
  test() {
    this.fail('[Testing]: This is test message :)');
    this.error('[Testing]: This is test message :)');
    this.info('[Testing]: This is test message :)');
    this.debug('[Testing]: This is test message :)');
    this.trace('[Testing]: This is test message :)');
    this.warn('[Testing]: This is test message :)');
  }



  /** Check existing logs files */
  private checkFilesystem() {
    const requiredFolders = [this.LOG_FOLDER, this.LOG_DUMP_FOLDER];

    const requiredFiles = [this.LOG_FILE, this.LOG_ERROR_FILE, this.LOG_SUSPICIOUS_FILE];

    requiredFolders.forEach(folder => {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
        console.log(`INFO [LoggerService]: Not existing folder ${folder} created.`);
      }
    });

    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '');
        console.log(`INFO [LoggerService]: Not existing file ${file} created.`);
      }
    });
  }

  /** Prepend log file & remove outdated rows */
  private prepend(data: string, path: string) {
    let rows = fs.readFileSync(path).toString().split('\n');

    // Make logs dump and clear
    if (rows.length > this.LOG_FILE_MAX_ROWS) {
      const dumpFile = `${this.LOG_DUMP_FOLDER}/${getUTC().fulldate}-${getUTC().timeAccurate.replaceAll(':', '.')}.log`;

      fs.writeFileSync(dumpFile, rows.join('\n'));
      rows = [];

      console.info(`[LoggerService]: Latest logs saved as ${dumpFile} and purged`);
    }

    rows.unshift(data);

    fs.writeFileSync(path, rows.join('\n'));
  }
}



export const Logger = new LoggerService();