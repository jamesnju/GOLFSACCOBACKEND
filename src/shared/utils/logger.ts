// src/shared/utils/logger.ts
export default {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args)
};

// import winston from 'winston';

// const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// const transports = [];

// // Always add console transport
// transports.push(
//   new winston.transports.Console({
//     format: winston.format.combine(
//       winston.format.colorize(),
//       winston.format.simple()
//     )
//   })
// );

// // Only add file transports if NOT on Vercel
// if (!isVercel) {
//   try {
//     const fs = require('fs');
//     const path = require('path');
//     const logDir = path.join(process.cwd(), 'logs');
    
//     if (!fs.existsSync(logDir)) {
//       fs.mkdirSync(logDir, { recursive: true });
//     }
    
//     transports.push(
//       new winston.transports.File({
//         filename: path.join(logDir, 'error.log'),
//         level: 'error'
//       }),
//       new winston.transports.File({
//         filename: path.join(logDir, 'combined.log')
//       })
//     );
//   } catch (error) {
//     console.warn('File logging disabled:', error.message);
//   }
// }

// const logger = winston.createLogger({
//   level: process.env.LOG_LEVEL || 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports
// });

// export default logger;

// // import winston from 'winston';

// // const isVercel = process.env.VERCEL === 'true';

// // // Create a logger that works in both environments
// // export const logger = winston.createLogger({
// //   level: process.env.LOG_LEVEL || 'info',
// //   format: winston.format.combine(
// //     winston.format.timestamp(),
// //     winston.format.errors({ stack: true }),
// //     winston.format.splat(),
// //     winston.format.json()
// //   ),
// //   transports: [
// //     // Console transport is always available
// //     new winston.transports.Console({
// //       format: winston.format.combine(
// //         winston.format.colorize(),
// //         winston.format.timestamp({
// //           format: 'YYYY-MM-DD HH:mm:ss'
// //         }),
// //         winston.format.printf(({ timestamp, level, message, ...meta }) => {
// //           const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
// //           return `${timestamp} [${level}]: ${message}${metaStr}`;
// //         })
// //       ),
// //     }),
// //     // Only add file transport locally (not in Vercel)
// //     ...(isVercel ? [] : [
// //       new winston.transports.File({
// //         filename: 'logs/error.log',
// //         level: 'error',
// //         format: winston.format.combine(
// //           winston.format.timestamp(),
// //           winston.format.json()
// //         )
// //       }),
// //       new winston.transports.File({
// //         filename: 'logs/combined.log',
// //         format: winston.format.combine(
// //           winston.format.timestamp(),
// //           winston.format.json()
// //         )
// //       }),
// //     ]),
// //   ],
// // });

// // // Add console logging for development
// // if (process.env.NODE_ENV !== 'production') {
// //   logger.add(
// //     new winston.transports.Console({
// //       format: winston.format.combine(
// //         winston.format.colorize(),
// //         winston.format.simple()
// //       ),
// //     })
// //   );
// // }


// // // import winston from 'winston';
// // // import { env } from '../../config/environment';

// // // const logFormat = winston.format.combine(
// // //   winston.format.timestamp(),
// // //   winston.format.errors({ stack: true }),
// // //   winston.format.printf(({ timestamp, level, message, stack }) => {
// // //     return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack ? `\n${stack}` : ''}`;
// // //   })
// // // );

// // // export const logger = winston.createLogger({
// // //   level: env.LOG_LEVEL,
// // //   format: logFormat,
// // //   transports: [
// // //     new winston.transports.Console({
// // //       format: winston.format.combine(
// // //         winston.format.colorize(),
// // //         logFormat
// // //       ),
// // //     }),
// // //     new winston.transports.File({
// // //       filename: 'logs/error.log',
// // //       level: 'error',
// // //     }),
// // //     new winston.transports.File({
// // //       filename: 'logs/combined.log',
// // //     }),
// // //   ],
// // // });

// // // export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
// // // export const logError = (message: string, meta?: any) => logger.error(message, meta);
// // // export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
// // // export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);