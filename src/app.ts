import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/environment';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middlewares/error.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import walletRoutes from './modules/wallets/wallets.routes';
import transactionRoutes from './modules/transactions/transactions.routes';
import loanRoutes from './modules/loans/loans.routes';
import paymentRoutes from './modules/payments/payments.routes';
import adminRoutes from './modules/admin/admin.routes';

// ✅ Explicitly typed as Express
const app: Express = express();

// Security Middleware
app.use(helmet());
app.use(compression());

// CORS
const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// ✅ ROOT ROUTE - Must be defined BEFORE other routes
app.get('/', (req: Request, res: Response) => {
  const apiVersion = env.API_VERSION || 'v1';
  const baseUrl = req.protocol + '://' + req.get('host');
  
  res.status(200).json({
    name: 'Greenlinks Sacco API',
    version: apiVersion,
    status: 'online',
    environment: env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    serverless: process.env.VERCEL === 'true',
    baseUrl: baseUrl,
    endpoints: {
      health: '/health',
      auth: `/api/${apiVersion}/auth`,
      wallets: `/api/${apiVersion}/wallets`,
      transactions: `/api/${apiVersion}/transactions`,
      loans: `/api/${apiVersion}/loans`,
      payments: `/api/${apiVersion}/payments`,
      admin: `/api/${apiVersion}/admin`
    }
  });
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API Routes
const API_VERSION = env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/wallets`, walletRoutes);
app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
app.use(`/api/${API_VERSION}/loans`, loanRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);

// 404 Handler - Must be AFTER all routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
});

// Global Error Handler - Must be LAST
app.use(errorHandler);

export default app;

// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import compression from 'compression';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import { env } from './config/environment';
// import { logger } from './shared/utils/logger';
// import { errorHandler } from './shared/middlewares/error.middleware';

// // Import routes
// import authRoutes from './modules/auth/auth.routes';
// import walletRoutes from './modules/wallets/wallets.routes';
// import transactionRoutes from './modules/transactions/transactions.routes';
// import loanRoutes from './modules/loans/loans.routes';
// import paymentRoutes from './modules/payments/payments.routes';
// import adminRoutes from './modules/admin/admin.routes';

// const app = express();

// // Security Middleware
// app.use(helmet());
// app.use(compression());

// // CORS
// const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );

// // Body Parsing
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Logging
// app.use(
//   morgan('combined', {
//     stream: {
//       write: (message) => logger.info(message.trim()),
//     },
//   })
// );

// // Rate Limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests from this IP, please try again later.',
// });
// app.use('/api', limiter);

// // Health Check
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//   });
// });

// // API Routes
// const API_VERSION = env.API_VERSION || 'v1';
// app.use(`/api/${API_VERSION}/auth`, authRoutes);
// app.use(`/api/${API_VERSION}/wallets`, walletRoutes);
// app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
// app.use(`/api/${API_VERSION}/loans`, loanRoutes);
// app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
// app.use(`/api/${API_VERSION}/admin`, adminRoutes);

// // 404 Handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found',
//     timestamp: new Date().toISOString(),
//   });
// });

// // Global Error Handler
// app.use(errorHandler);

// export default app;