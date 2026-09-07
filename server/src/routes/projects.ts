import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { calculateQAEstimate } from '../services/calculator.js';

export const projectsRouter = Router();

// Get all projects with filtering & search
projectsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, type, complexity, status, sortBy = 'updatedAt', order = 'desc' } = req.query;

    const where: any = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { type: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (type && type !== 'All') {
      where.type = String(type);
    }
    if (complexity && complexity !== 'All') {
      where.complexity = String(complexity);
    }
    if (status && status !== 'All') {
      where.status = String(status);
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { [String(sortBy)]: order === 'asc' ? 'asc' : 'desc' },
      include: {
        _count: {
          select: { testCaseItems: true, reports: true, history: true },
        },
      },
    });

    return res.json({ projects });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
projectsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        testCaseItems: {
          orderBy: { createdAt: 'asc' },
        },
        estimations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        reports: {
          orderBy: { createdAt: 'desc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Include calculated live metrics
    const latestEstimation = calculateQAEstimate({
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

    return res.json({ project, metrics: latestEstimation });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Create project
projectsRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      type = 'Full Stack Application',
      loc = 10000,
      testCases = 300,
      coverage = 80.0,
      automationPercent = 30.0,
      complexity = 'Medium',
      environments = 1,
      apiCount = 10,
      description,
      status = 'Active',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const calc = calculateQAEstimate({
      projectName: name,
      projectType: type,
      loc: Number(loc),
      testCases: Number(testCases),
      coverage: Number(coverage),
      automationPercent: Number(automationPercent),
      complexity,
      environments: Number(environments),
      apiCount: Number(apiCount),
    });

    const project = await prisma.project.create({
      data: {
        userId: req.user!.id,
        name: name.trim(),
        type,
        loc: calc.loc,
        testCases: calc.testCases,
        coverage: calc.coverage,
        automationPercent: calc.automationPercent,
        complexity: calc.complexity,
        environments: calc.environments,
        apiCount: calc.apiCount,
        estimatedHours: calc.totalHours,
        personDays: calc.personDays,
        personWeeks: calc.personWeeks,
        status,
        description: description || `Software QA resource estimate for ${name.trim()}`,
      },
    });

    // Create associated estimation
    await prisma.estimation.create({
      data: {
        projectId: project.id,
        projectName: project.name,
        loc: project.loc,
        testCases: project.testCases,
        coverage: project.coverage,
        automationPercent: project.automationPercent,
        complexity: project.complexity,
        environments: project.environments,
        apiCount: project.apiCount,
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
      },
    });

    // Add to history
    await prisma.estimationHistory.create({
      data: {
        projectId: project.id,
        projectName: project.name,
        loc: project.loc,
        testCases: project.testCases,
        coverage: project.coverage,
        complexity: project.complexity,
        environments: project.environments,
        estimatedHours: calc.totalHours,
      },
    });

    return res.status(201).json({ project, metrics: calc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
projectsRouter.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      type,
      loc,
      testCases,
      coverage,
      automationPercent,
      complexity,
      environments,
      apiCount,
      status,
      description,
    } = req.body;

    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const newLoc = loc !== undefined ? Number(loc) : existing.loc;
    const newTestCases = testCases !== undefined ? Number(testCases) : existing.testCases;
    const newCoverage = coverage !== undefined ? Number(coverage) : existing.coverage;
    const newAutomation = automationPercent !== undefined ? Number(automationPercent) : existing.automationPercent;
    const newComplexity = complexity || existing.complexity;
    const newEnvironments = environments !== undefined ? Number(environments) : existing.environments;
    const newApiCount = apiCount !== undefined ? Number(apiCount) : existing.apiCount;
    const newName = name || existing.name;

    const calc = calculateQAEstimate({
      projectName: newName,
      projectType: type || existing.type,
      loc: newLoc,
      testCases: newTestCases,
      coverage: newCoverage,
      automationPercent: newAutomation,
      complexity: newComplexity,
      environments: newEnvironments,
      apiCount: newApiCount,
    });

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: newName }),
        ...(type && { type }),
        loc: newLoc,
        testCases: newTestCases,
        coverage: newCoverage,
        automationPercent: newAutomation,
        complexity: newComplexity,
        environments: newEnvironments,
        apiCount: newApiCount,
        estimatedHours: calc.totalHours,
        personDays: calc.personDays,
        personWeeks: calc.personWeeks,
        ...(status && { status }),
        ...(description !== undefined && { description }),
      },
    });

    // Create new estimation version record
    await prisma.estimation.create({
      data: {
        projectId: updated.id,
        projectName: updated.name,
        loc: updated.loc,
        testCases: updated.testCases,
        coverage: updated.coverage,
        automationPercent: updated.automationPercent,
        complexity: updated.complexity,
        environments: updated.environments,
        apiCount: updated.apiCount,
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
      },
    });

    // Add to history
    await prisma.estimationHistory.create({
      data: {
        projectId: updated.id,
        projectName: updated.name,
        loc: updated.loc,
        testCases: updated.testCases,
        coverage: updated.coverage,
        complexity: updated.complexity,
        environments: updated.environments,
        estimatedHours: calc.totalHours,
      },
    });

    return res.json({ project: updated, metrics: calc });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// Duplicate project
projectsRouter.post('/:id/duplicate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { testCaseItems: true },
    });
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const duplicated = await prisma.project.create({
      data: {
        userId: req.user!.id,
        name: `${existing.name} (Copy)`,
        type: existing.type,
        loc: existing.loc,
        testCases: existing.testCases,
        coverage: existing.coverage,
        automationPercent: existing.automationPercent,
        complexity: existing.complexity,
        environments: existing.environments,
        apiCount: existing.apiCount,
        estimatedHours: existing.estimatedHours,
        personDays: existing.personDays,
        personWeeks: existing.personWeeks,
        status: 'Planning',
        description: `Copy of ${existing.name}`,
      },
    });

    return res.status(201).json({ project: duplicated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to duplicate project' });
  }
});

// Delete project
projectsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});
