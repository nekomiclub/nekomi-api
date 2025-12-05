import conf from '~/config';
import winston, { format } from 'winston';
import { getUTC } from '~/utils/utils';



const fileFormat = format.combine(
  format.timestamp({ format: () => `${getUTC().fulldate} ${getUTC().time}` }),
  format.errors({ stack: true }),
  format.printf(({ level, message, timestamp }) => `[${timestamp}] [${level.toUpperCase()}]\t${message}`),
);



const logger = winston.createLogger({
  level: 'debug',
  defaultMeta: {
    service: 'nekomi-api',
    commit: conf.commit
  },
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.timestamp({ format: () => getUTC().time }),
        format.errors({ stack: true }),
        format.printf(({ level, message, timestamp }) => `[${timestamp}] [${level.toUpperCase()}] ${message}`),
        format.colorize({ all: true })
      )
    }),
    new winston.transports.File({
      level: 'debug',
      dirname: 'logs',
      filename: 'latest.log',
      format: fileFormat
    }),
    new winston.transports.File({
      level: 'error',
      dirname: 'logs',
      filename: 'error.log',
      format: fileFormat
    }),
  ],
});



class LoggerService {
  error(message: string, ...args: any[]) { logger.error(message, ...args); }
  warn(message: string, ...args: any[]) { logger.warn(message, ...args); }
  info(message: string, ...args: any[]) { logger.info(message, ...args); }
  http(message: string, ...args: any[]) { logger.http(message, ...args); }
  verbose(message: string, ...args: any[]) { logger.verbose(message, ...args); }
  debug(message: string, ...args: any[]) { logger.debug(message, ...args); }
  silly(message: string, ...args: any[]) { logger.silly(message, ...args); }
}

const log = new LoggerService();
export default log;