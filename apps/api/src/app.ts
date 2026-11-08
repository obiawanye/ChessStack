import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
<<<<<<< HEAD
import accountRoutes from './routes/accounts';
import authRoutes from './routes/auth';
import gameRoutes from './routes/games';
import settingsRoutes from './routes/settings';
=======
import analysisRoutes from "./routes/analysis.routes";
import { errorMiddleware } from "./middleware/error.middleware";
>>>>>>> origin/main

const app = express();

// Security middleware
app.use(helmet());

// Cross-origin resource sharing
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);

// Request logging
app.use(pinoHttp());

// Request body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ChessStack API',
    timestamp: new Date().toISOString(),
  });
});

<<<<<<< HEAD
export default app;
=======
app.use("/api/v1/analysis", analysisRoutes)
app.use(errorMiddleware);

export default app;
>>>>>>> origin/main
