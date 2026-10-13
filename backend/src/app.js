import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import researchRoutes from './routes/research.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDbStatus } from './config/db.js';
import { getGenAIClient, getModelName } from './services/gemini.service.js';

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: false // Allows client to consume API cleanly
}));

// 2. CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Request Body Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 4. HTTP Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const geminiConfigured = Boolean(getGenAIClient());

  res.json({
    status: 'healthy',
    product: 'ResearchLens AI Backend API',
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    database: {
      status: 'connected',
      mode: dbStatus.mode,
      isPostgres: dbStatus.isPostgres,
      isLocalFallback: dbStatus.isLocal
    },
    ai: {
      geminiConfigured,
      configuredModel: getModelName()
    },
    timestamp: new Date().toISOString()
  });
});

// 6. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/research', researchRoutes);

// 7. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// 8. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
