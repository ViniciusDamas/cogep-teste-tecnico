import express, { Express } from 'express';
import cors from 'cors';
import { router } from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';

export function createServer(): Express {
  const app = express();

  const allowed = env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: allowed.includes('*') ? true : allowed,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', router);

  app.use(errorHandler);

  return app;
}
