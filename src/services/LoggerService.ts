import { addZeroIfNumberSingle, getUTC } from '../handlers/handlers';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export const LOG_TYPES = ['info', 'warn', 'error', 'fail', 'debug', 'trace'] as const;
export type TLogType = typeof LOG_TYPES[number];

/** Standalone Logging service */
export class LoggerService {
  private MAX_TYPE_LENGTH = Math.max(...LOG_TYPES.map(el => el.length));
  private ROOT_DIR = path.resolve();

  private LOG_FOLDER = `${this.ROOT_DIR}/logs`;
  private LOG_FILE = `${this.LOG_FOLDER}/.log`;
  private LOG_ERROR_FILE = `${this.LOG_FOLDER}/error.log`;
  private LOG_FILE_MAX_ROWS = 30000;

  constructor() {
    this.checkFilesystem();

    console.clear();
    this.debug(`[Startup]: ------------------ DRY RUN ------------------`);
  }

  /** Write log */
  private append({ msg, type, e }: { type: TLogType, msg: string, e?: any }) {
    const emsg = e?.msg || e?.message || e?.data?.message || e?.data?.msg || e?.response?.data?.message || e?.response?.data?.message;
    const date = `${getUTC().dateReversed}/${getUTC().time}.${addZeroIfNumberSingle(getUTC().secs)}:${getUTC().ms < 100 ? `0${addZeroIfNumberSingle(getUTC().ms)}` : getUTC().ms}`;
    const parsedType = `${type.toUpperCase()}${[...Array(this.MAX_TYPE_LENGTH - type.length + 1).keys()].map(el => null).join(' ')}`;

    const logMessage = `${msg}.${e !== undefined ? ` ${emsg ? `EMSG - ${emsg}` : `Stack - ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)}`}` : ''}`;
    const log = `${parsedType} (${date}) | ${logMessage}`;

    this.prepend(log, this.LOG_FILE);

    if (type === 'error' || type === 'fail') {
      this.prepend(log, this.LOG_ERROR_FILE);
      console.log(chalk.red(`${parsedType} | ${logMessage}`));
    } else if (type === 'info') {
      console.log(chalk.green(`${parsedType} | ${logMessage}`));
    } else if (type === 'debug' || type === 'trace') {
      console.debug(chalk.grey(`${parsedType} | ${logMessage}`));
    } else if (type === 'warn') {
      console.log(chalk.yellow(`${parsedType} | ${logMessage}`));
    } else {
      console.log(`${chalk.bgRed(`(TYPE NOT SPECIFIED IN LOGGER SERVICE)`)} ${parsedType} | ${logMessage}`);
    }
  }



  /** Business logic log */
  info(msg: string) {
    this.append({
      type: 'info',
      msg
    });
  }

  /** In-service warn */
  warn(msg: string) {
    this.append({
      type: 'warn',
      msg
    });
  }

  /** In-service error */
  error(msg: string, e?: any) {
    this.append({
      type: 'error',
      msg,
      e
    });
  }

  /** User request error */
  fail(msg: string, e?: any) {
    this.append({
      type: 'fail',
      msg,
      e
    });
  }

  /** Tech stack log */
  debug(msg: string) {
    this.append({
      type: 'debug',
      msg
    });
  }

  /** Request / Response */
  trace(msg: string) {
    this.append({
      type: 'trace',
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
    const requiredFolders = [this.LOG_FOLDER];

    const requiredFiles = [this.LOG_FILE, this.LOG_ERROR_FILE];

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

    if (rows.length > this.LOG_FILE_MAX_ROWS) {
      rows = rows.slice(0, this.LOG_FILE_MAX_ROWS);
    }

    rows.unshift(data);

    fs.writeFileSync(path, rows.join('\n'));
  }
}