import app from './app';
import { env } from './config/environment';
import { prisma } from './config/database';

// ✅ CRITICAL: Export app for Vercel serverless environment
export default app;

// Only start server if NOT in Vercel (local development)
if (process.env.VERCEL !== 'true') {
  const PORT = env.PORT || 5000;

  async function startServer() {
    try {
      // Connect to database
      await prisma.$connect();
      //logger.info('✅ Database connected successfully');

      // Start the server
      app.listen(PORT, () => {
        //logger.info(`🚀 Server running on http://localhost:${PORT}`);
        //logger.info(`📚 API Version: ${env.API_VERSION || 'v1'}`);
        //logger.info(`🌍 Environment: ${env.NODE_ENV}`);
       // logger.info(`📍 Mode: Local Development`);
      });
    } catch (error) {
      //logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
} else {
  // Vercel environment - just log that we're in serverless mode
  // logger.info('🌐 Running in Vercel serverless environment');
  // logger.info(`📚 API Version: ${env.API_VERSION || 'v1'}`);
  // logger.info(`🌍 Environment: ${env.NODE_ENV}`);
}

// import app from './app';
// import { env } from './config/environment';
// import { logger } from './shared/utils/logger';
// import { prisma } from './config/database';

// const PORT = env.PORT || 5000;

// async function startServer() {
//   try {
//     // For Vercel, we don't need to listen on a port
//     // The serverless function handles requests
    
//     // Only start server if not in serverless environment
//     if (process.env.VERCEL !== 'true') {
//       await prisma.$connect();
//       logger.info('✅ Database connected successfully');

//       app.listen(PORT, () => {
//         logger.info(`🚀 Server running on http://localhost:${PORT}`);
//         logger.info(`📚 API Version: ${env.API_VERSION || 'v1'}`);
//         logger.info(`🌍 Environment: ${env.NODE_ENV}`);
//       });
//     } else {
//       // Vercel serverless environment
//       await prisma.$connect();
//       logger.info('✅ Database connected successfully (Vercel)');
//     }
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     if (process.env.VERCEL !== 'true') {
//       process.exit(1);
//     }
//   }
// }

// // Export app for Vercel
// export default app;

// // Start server if not in Vercel environment
// if (process.env.VERCEL !== 'true') {
//   startServer();
// }

// import app from './app';
// import { env } from './config/environment';
// import { logger } from './shared/utils/logger';
// import { prisma } from './config/database';

// const PORT = env.PORT || 5000;

// async function startServer() {
//   try {
//     // Test database connection
//     await prisma.$connect();
//     logger.info('✅ Database connected successfully');

//     // Start server
//     app.listen(PORT, () => {
//       logger.info(`🚀 Server running on http://localhost:${PORT}`);
//       logger.info(`📚 API Version: ${env.API_VERSION || 'v1'}`);
//       logger.info(`🌍 Environment: ${env.NODE_ENV}`);
//     });
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// // Graceful shutdown
// process.on('SIGTERM', async () => {
//   logger.info('SIGTERM received, shutting down gracefully...');
//   await prisma.$disconnect();
//   process.exit(0);
// });

// process.on('SIGINT', async () => {
//   logger.info('SIGINT received, shutting down gracefully...');
//   await prisma.$disconnect();
//   process.exit(0);
// });

// startServer();