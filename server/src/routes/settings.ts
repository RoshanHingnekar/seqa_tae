import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const settingsRouter = Router();

// Get settings
settingsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: 'global-config' },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: 'global-config',
          locRate: 6.4,
          testCaseRate: 0.1242,
          baselineCoverage: 70.0,
          lowMultiplier: 0.85,
          medMultiplier: 1.00,
          highMultiplier: 1.25,
          env1Multiplier: 1.00,
          env2Multiplier: 1.10,
          env3Multiplier: 1.20,
          workingHoursPerDay: 8.0,
          workingDaysPerWeek: 5.0,
        },
      });
    }

    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
settingsRouter.put('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      locRate,
      testCaseRate,
      baselineCoverage,
      lowMultiplier,
      medMultiplier,
      highMultiplier,
      env1Multiplier,
      env2Multiplier,
      env3Multiplier,
      workingHoursPerDay,
      workingDaysPerWeek,
    } = req.body;

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'global-config' },
      update: {
        ...(locRate !== undefined && { locRate: Number(locRate) }),
        ...(testCaseRate !== undefined && { testCaseRate: Number(testCaseRate) }),
        ...(baselineCoverage !== undefined && { baselineCoverage: Number(baselineCoverage) }),
        ...(lowMultiplier !== undefined && { lowMultiplier: Number(lowMultiplier) }),
        ...(medMultiplier !== undefined && { medMultiplier: Number(medMultiplier) }),
        ...(highMultiplier !== undefined && { highMultiplier: Number(highMultiplier) }),
        ...(env1Multiplier !== undefined && { env1Multiplier: Number(env1Multiplier) }),
        ...(env2Multiplier !== undefined && { env2Multiplier: Number(env2Multiplier) }),
        ...(env3Multiplier !== undefined && { env3Multiplier: Number(env3Multiplier) }),
        ...(workingHoursPerDay !== undefined && { workingHoursPerDay: Number(workingHoursPerDay) }),
        ...(workingDaysPerWeek !== undefined && { workingDaysPerWeek: Number(workingDaysPerWeek) }),
      },
      create: {
        id: 'global-config',
        locRate: Number(locRate) || 6.4,
        testCaseRate: Number(testCaseRate) || 0.1242,
        baselineCoverage: Number(baselineCoverage) || 70.0,
        lowMultiplier: Number(lowMultiplier) || 0.85,
        medMultiplier: Number(medMultiplier) || 1.00,
        highMultiplier: Number(highMultiplier) || 1.25,
        env1Multiplier: Number(env1Multiplier) || 1.00,
        env2Multiplier: Number(env2Multiplier) || 1.10,
        env3Multiplier: Number(env3Multiplier) || 1.20,
        workingHoursPerDay: Number(workingHoursPerDay) || 8.0,
        workingDaysPerWeek: Number(workingDaysPerWeek) || 5.0,
      },
    });

    return res.json({ settings: updated, message: 'Settings updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});
