import winston from 'winston';
import { env } from '../../config/environment';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack ? `\n${stack}` : ''}`;
  })
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logError = (message: string, meta?: any) => logger.error(message, meta);
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);