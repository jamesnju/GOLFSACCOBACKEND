import winston from 'winston';
import path from 'path';

// Determine if running on Vercel
const isVercel = process.env.VERCEL === 'true';

// Configure log directory based on environment
const logDir = isVercel ? '/tmp/logs' : 'logs';

// Only create directory if not in Vercel (or use /tmp)
if (!isVercel) {
  try {
    const fs = require('fs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (error) {
    console.warn('Could not create logs directory:', error);
  }
}

// Configure transports
const transports: winston.transport[] = [
  // Always log to console
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;
      })
    ),
  }),
];

// Add file transport only if not in Vercel
if (!isVercel) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports,
});

// For local development, also log to console with better formatting
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}


// import winston from 'winston';
// import { env } from '../../config/environment';

// const logFormat = winston.format.combine(
//   winston.format.timestamp(),
//   winston.format.errors({ stack: true }),
//   winston.format.printf(({ timestamp, level, message, stack }) => {
//     return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack ? `\n${stack}` : ''}`;
//   })
// );

// export const logger = winston.createLogger({
//   level: env.LOG_LEVEL,
//   format: logFormat,
//   transports: [
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         logFormat
//       ),
//     }),
//     new winston.transports.File({
//       filename: 'logs/error.log',
//       level: 'error',
//     }),
//     new winston.transports.File({
//       filename: 'logs/combined.log',
//     }),
//   ],
// });

// export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
// export const logError = (message: string, meta?: any) => logger.error(message, meta);
// export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
// export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);