import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { calculateQAEstimate } from '../services/calculator.js';

export const reportsRouter = Router();

// Get reports
reportsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, reportType } = req.query;
    const where: any = {};
    if (projectId && projectId !== 'all') {
      where.projectId = String(projectId);
    }
    if (reportType && reportType !== 'all') {
      where.reportType = String(reportType);
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { name: true, type: true, estimatedHours: true },
        },
      },
    });

    return res.json({ reports });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Generate new report
reportsRouter.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, reportType, title, notes } = req.body;

    if (!projectId || !reportType) {
      return res.status(400).json({ error: 'Project ID and Report Type are required' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        testCaseItems: true,
        estimations: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const calc = calculateQAEstimate({
      projectName: project.name,
      projectType: project.type,
      loc: project.loc,
      testCases: project.testCases,
      coverage: project.coverage,
      automationPercent: project.automationPercent,
      complexity: project.complexity,
      environments: project.environments,
      apiCount: project.apiCount,
    });

    const passedCases = project.testCaseItems.filter((c) => c.status === 'Passed').length;
    const totalCases = project.testCaseItems.length;

    const reportPayload = {
      project: {
        id: project.id,
        name: project.name,
        type: project.type,
        loc: project.loc,
        testCases: project.testCases,
        coverage: project.coverage,
        complexity: project.complexity,
        environments: project.environments,
        apiCount: project.apiCount,
      },
      estimationMetrics: calc,
      testExecution: {
        totalTracked: totalCases,
        passed: passedCases,
        passRate: totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 100,
      },
      generatedBy: req.user!.email,
      notes: notes || '',
      generatedAt: new Date().toISOString(),
    };

    const report = await prisma.report.create({
      data: {
        projectId,
        reportType,
        title: title || `${reportType} - ${project.name}`,
        summary: `QA estimation assessment for ${project.name}: ${calc.totalHours} person-hours (${calc.personDays} days), ${calc.recommendedTeam.totalTeamSize} specialists recommended.`,
        data: JSON.stringify(reportPayload),
      },
      include: {
        project: {
          select: { name: true, type: true, estimatedHours: true },
        },
      },
    });

    return res.status(201).json({ report });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get single report
reportsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
      },
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    return res.json({ report });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Delete report
reportsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.report.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete report' });
  }
});
