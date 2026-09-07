import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const testCasesRouter = Router();

// Get test cases with filters
testCasesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, status, priority, type, module, search } = req.query;

    const where: any = {};
    if (projectId && projectId !== 'all') {
      where.projectId = String(projectId);
    }
    if (status && status !== 'all') {
      where.status = String(status);
    }
    if (priority && priority !== 'all') {
      where.priority = String(priority);
    }
    if (type && type !== 'all') {
      where.type = String(type);
    }
    if (module && module !== 'all') {
      where.module = String(module);
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { testId: { contains: search } },
        { title: { contains: search } },
        { module: { contains: search } },
        { assignedTo: { contains: search } },
      ];
    }

    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    return res.json({ testCases });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch test cases' });
  }
});

// Test Cases Statistics
testCasesRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId && projectId !== 'all') {
      where.projectId = String(projectId);
    }

    const allCases = await prisma.testCase.findMany({ where });
    const total = allCases.length;
    const passed = allCases.filter((c) => c.status === 'Passed').length;
    const failed = allCases.filter((c) => c.status === 'Failed').length;
    const blocked = allCases.filter((c) => c.status === 'Blocked').length;
    const notRun = allCases.filter((c) => c.status === 'Not Run').length;
    const automated = allCases.filter((c) => c.type === 'Automated').length;

    const automationCoverage = total > 0 ? Math.round((automated / total) * 100) : 0;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return res.json({
      total,
      passed,
      failed,
      blocked,
      notRun,
      automated,
      automationCoverage,
      passRate,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch test case stats' });
  }
});

// Create test case
testCasesRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, testId, title, module, priority = 'P2', type = 'Manual', status = 'Not Run', assignedTo, steps } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ error: 'Project ID and test case title are required' });
    }

    // Auto generate testId if not provided
    const count = await prisma.testCase.count({ where: { projectId } });
    const finalTestId = testId?.trim() || `TC-${101 + count}`;

    const newCase = await prisma.testCase.create({
      data: {
        projectId,
        testId: finalTestId,
        title: title.trim(),
        module: module?.trim() || 'General',
        priority,
        type,
        status,
        assignedTo: assignedTo || 'Unassigned',
        steps: steps || '',
      },
    });

    return res.status(201).json({ testCase: newCase });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create test case' });
  }
});

// Batch import test cases
testCasesRouter.post('/batch-import', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, items } = req.body;
    if (!projectId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Valid projectId and array of items required' });
    }

    const createdItems = [];
    const count = await prisma.testCase.count({ where: { projectId } });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const created = await prisma.testCase.create({
        data: {
          projectId,
          testId: item.testId || `TC-${101 + count + i}`,
          title: item.title || `Test Case ${101 + count + i}`,
          module: item.module || 'General',
          priority: item.priority || 'P2',
          type: item.type || 'Manual',
          status: item.status || 'Not Run',
          assignedTo: item.assignedTo || 'Unassigned',
        },
      });
      createdItems.push(created);
    }

    return res.status(201).json({ count: createdItems.length, items: createdItems });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to batch import test cases' });
  }
});

// Update test case
testCasesRouter.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, module, priority, type, status, assignedTo, steps } = req.body;

    const updated = await prisma.testCase.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(module && { module }),
        ...(priority && { priority }),
        ...(type && { type }),
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(steps !== undefined && { steps }),
      },
    });

    return res.json({ testCase: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update test case' });
  }
});

// Delete test case
testCasesRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.testCase.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Test case deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete test case' });
  }
});
