import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { estimationsRouter } from './routes/estimations.js';
import { testCasesRouter } from './routes/testCases.js';
import { teamRouter } from './routes/team.js';
import { reportsRouter } from './routes/reports.js';
import { settingsRouter } from './routes/settings.js';
import { notificationsRouter } from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    service: 'QAEstimator Pro Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/estimations', estimationsRouter);
app.use('/api/test-cases', testCasesRouter);
app.use('/api/team', teamRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);

// Serve Frontend Static Bundle in Production / Render
const possibleDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];

let clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath!, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error', details: err?.message });
});

app.listen(PORT, () => {
  console.log(`🚀 QAEstimator Pro API Server is running on port ${PORT}`);
});
