import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import analysisRoutes from "./routes/analysis.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

// Security middleware
app.use(helmet());

// Cross-origin resource sharing
app.use(cors());

// Request logging
app.use(pinoHttp());

// Request body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ChessStack API',
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/analysis", analysisRoutes)
app.use(errorMiddleware);

export default app;