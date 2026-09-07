import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { calculateQAEstimate } from '../services/calculator.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const estimationsRouter = Router();

// Dynamic calculation without saving
estimationsRouter.post('/calculate', (req: Request, res: Response) => {
  try {
    const input = req.body;
    const result = calculateQAEstimate(input);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Calculation error' });
  }
});

// Save estimation
estimationsRouter.post('/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body;
    const calc = calculateQAEstimate(input);

    const saved = await prisma.estimation.create({
      data: {
        projectId: input.projectId || null,
        projectName: calc.projectName,
        loc: calc.loc,
        testCases: calc.testCases,
        coverage: calc.coverage,
        automationPercent: calc.automationPercent,
        complexity: calc.complexity,
        environments: calc.environments,
        apiCount: calc.apiCount,
        locEffort: calc.locEffort,
        testCaseEffort: calc.testCaseEffort,
        coverageMultiplier: calc.coverageMultiplier,
        complexityMultiplier: calc.complexityMultiplier,
        envMultiplier: calc.envMultiplier,
        totalHours: calc.totalHours,
        personDays: calc.personDays,
        personWeeks: calc.personWeeks,
        recommendedTeam: JSON.stringify(calc.recommendedTeam),
        breakdown: JSON.stringify(calc.breakdown),
        notes: input.notes || null,
      },
    });

    // Also record in history
    await prisma.estimationHistory.create({
      data: {
        projectId: input.projectId || null,
        projectName: calc.projectName,
        loc: calc.loc,
        testCases: calc.testCases,
        coverage: calc.coverage,
        complexity: calc.complexity,
        environments: calc.environments,
        estimatedHours: calc.totalHours,
      },
    });

    return res.status(201).json({ estimation: saved, metrics: calc });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save estimation' });
  }
});

// Get estimation history
estimationsRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const { search, complexity, sortBy = 'createdAt', order = 'desc' } = req.query;

    const where: any = {};
    if (search && typeof search === 'string') {
      where.projectName = { contains: search };
    }
    if (complexity && complexity !== 'All') {
      where.complexity = String(complexity);
    }

    const history = await prisma.estimationHistory.findMany({
      where,
      orderBy: { [String(sortBy)]: order === 'asc' ? 'asc' : 'desc' },
      take: 50,
    });

    return res.json({ history });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch estimation history' });
  }
});

// Delete history record
estimationsRouter.delete('/history/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.estimationHistory.delete({ where: { id: req.params.id } });
    return res.json({ message: 'History record removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete history record' });
  }
});

// Get single estimation
estimationsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const estimation = await prisma.estimation.findUnique({
      where: { id: req.params.id },
    });
    if (!estimation) return res.status(404).json({ error: 'Estimation not found' });
    return res.json({ estimation });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch estimation' });
  }
});
