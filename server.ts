import 'dotenv/config';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import chatRouter from './api/chat';
import { initDatabase } from './database/database';
import { logger } from './utils/logger';

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_DIST = path.join(process.cwd(), 'dist', 'client');

initDatabase();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use('/api', chatRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Serves the Vite build in production. In dev, the Vite dev server (port 5173)
// handles the frontend directly and proxies /api here instead.
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(CLIENT_DIST, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled server error', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  logger.info(`agentic-ai server listening on http://localhost:${PORT}`);
});
