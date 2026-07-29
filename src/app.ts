import express from 'express';
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

const app = express();

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
      write: (message) => logger.info(message.trim()),
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

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root Route - Default UI
app.get('/', (req, res) => {
  const apiVersion = env.API_VERSION || 'v1';
  const baseUrl = req.protocol + '://' + req.get('host');
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Greenlinks Sacco API</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 50px;
          max-width: 800px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
          color: #333;
          font-size: 2.5rem;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .status-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .subtitle {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 30px;
        }
        .endpoints {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }
        .endpoint-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          border-left: 4px solid #667eea;
          transition: transform 0.2s;
        }
        .endpoint-card:hover {
          transform: translateY(-2px);
        }
        .endpoint-card .method {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .endpoint-card .path {
          color: #333;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .endpoint-card .description {
          color: #666;
          font-size: 0.85rem;
          margin-top: 5px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-item .label {
          font-size: 0.8rem;
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-item .value {
          font-size: 1rem;
          color: #333;
          font-weight: 500;
          margin-top: 2px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #999;
          font-size: 0.85rem;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .container { padding: 30px; }
          h1 { font-size: 2rem; }
          .info-grid { grid-template-columns: 1fr; }
          .endpoints { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>
          🚀 Greenlinks Sacco API
          <span class="status-badge">● Online</span>
        </h1>
        <p class="subtitle">RESTful API for Greenlinks Sacco Management System</p>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Version</span>
            <span class="value">${apiVersion}</span>
          </div>
          <div class="info-item">
            <span class="label">Environment</span>
            <span class="value">${env.NODE_ENV || 'development'}</span>
          </div>
          <div class="info-item">
            <span class="label">Serverless</span>
            <span class="value">${process.env.VERCEL === 'true' ? '✅ Vercel' : '❌ Local'}</span>
          </div>
          <div class="info-item">
            <span class="label">Status</span>
            <span class="value" style="color: #10b981;">✅ Operational</span>
          </div>
        </div>

        <h3 style="margin: 30px 0 15px; color: #333;">📡 Available Endpoints</h3>
        <div class="endpoints">
          <div class="endpoint-card">
            <span class="method">POST</span>
            <div class="path">/api/${apiVersion}/auth</div>
            <div class="description">Authentication endpoints</div>
          </div>
          <div class="endpoint-card">
            <span class="method">GET</span>
            <div class="path">/api/${apiVersion}/wallets</div>
            <div class="description">Wallet management</div>
          </div>
          <div class="endpoint-card">
            <span class="method">GET</span>
            <div class="path">/api/${apiVersion}/transactions</div>
            <div class="description">Transaction history</div>
          </div>
          <div class="endpoint-card">
            <span class="method">GET</span>
            <div class="path">/api/${apiVersion}/loans</div>
            <div class="description">Loan management</div>
          </div>
          <div class="endpoint-card">
            <span class="method">GET</span>
            <div class="path">/api/${apiVersion}/payments</div>
            <div class="description">Payment processing</div>
          </div>
          <div class="endpoint-card">
            <span class="method">GET</span>
            <div class="path">/api/${apiVersion}/admin</div>
            <div class="description">Admin operations</div>
          </div>
        </div>

        <div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-radius: 10px; border-left: 4px solid #667eea;">
          <p style="color: #333; font-size: 0.95rem;">
            <strong>💡 Quick Links:</strong>
            <br>
            <a href="/health" style="color: #667eea; text-decoration: none;">Health Check</a> • 
            <a href="/api/${apiVersion}/auth" style="color: #667eea; text-decoration: none;">Auth Endpoint</a> • 
            <span style="color: #666;">Base URL: ${baseUrl}</span>
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Greenlinks Sacco. All rights reserved.</p>
          <p style="margin-top: 5px;">
            <a href="#" target="_blank">Documentation</a> • 
            <a href="#" target="_blank">Support</a> • 
            <a href="#" target="_blank">GitHub</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Routes
const API_VERSION = env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/wallets`, walletRoutes);
app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
app.use(`/api/${API_VERSION}/loans`, loanRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// Global Error Handler
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