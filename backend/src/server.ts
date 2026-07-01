import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import cardRouter from './routes/cardRoutes';
import offerRouter from './routes/offerRoutes';
import portfolioRouter from './routes/portfolioRoutes';
import alertRouter from './routes/alertRoutes';
import providerRouter from './routes/providerRoutes';
import backupRouter from './routes/backupRoutes';
import weeklyStrategyRouter from './routes/weeklyStrategyRoutes';
import { checkAllProvidersStatus } from './services/providerStatusService';

import { apiRateLimiter } from './middleware/rateLimit';

// Initialize environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Setup CORS with production whitelist validation
const corsOriginEnv = process.env.CORS_ORIGIN;
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map(o => o.trim())
  : isProduction
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (!isProduction) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
};

app.use(cors(corsOptions));

// Global API rate limiting
app.use('/api', apiRateLimiter);

// Dynamic JSON body size limit configurations
app.use((req, res, next) => {
  const cleanPath = req.path.replace(/\/$/, '');
  if (cleanPath === '/api/import/json') {
    express.json({ limit: '5mb' })(req, res, next);
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Run simple query to test db connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: err.message,
      timestamp: new Date(),
    });
  }
});

// Mount routers
app.use('/api/cards', cardRouter);
app.use('/api/offers', offerRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/providers', providerRouter);
app.use('/api/weekly-strategies', weeklyStrategyRouter);

// Bind export and import endpoints to backup router
app.use('/api/export', backupRouter);
app.use('/api/import', backupRouter);

// Start server
app.listen(PORT, async () => {
  console.log(`[Server] CardAdvisor backend listening on http://localhost:${PORT}`);
  
  // Verify/check TCG providers status on start
  try {
    console.log('[Server] Evaluating active pricing providers status...');
    await checkAllProvidersStatus();
    console.log('[Server] Providers status check completed.');
  } catch (err: any) {
    console.error('[Server] Provider initialization status check failed:', err.message);
  }
});
