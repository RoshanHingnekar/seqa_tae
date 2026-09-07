import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { estimationsRouter } from './routes/estimations.js';
import { testCasesRouter } from './routes/testCases.js';
import { teamRouter } from './routes/team.js';
import { reportsRouter } from './routes/reports.js';
import { settingsRouter } from './routes/settings.js';
import { notificationsRouter } from './routes/notifications.js';

dotenv.config();

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

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/estimations', estimationsRouter);
app.use('/api/test-cases', testCasesRouter);
app.use('/api/team', teamRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationsRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error', details: err?.message });
});

app.listen(PORT, () => {
  console.log(`🚀 QAEstimator Pro API Server is running on http://localhost:${PORT}`);
});
