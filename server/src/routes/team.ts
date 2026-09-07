import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const teamRouter = Router();

// Get team members
teamRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Calculate aggregated capacity metrics
    const totalMembers = members.length;
    const avgCapacity = totalMembers > 0 ? Math.round(members.reduce((acc, m) => acc + m.capacity, 0) / totalMembers) : 0;
    const availableCount = members.filter((m) => m.availability === 'Available').length;
    const busyCount = members.filter((m) => m.availability === 'Busy').length;

    return res.json({
      members,
      stats: {
        totalMembers,
        avgCapacity,
        availableCount,
        busyCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Add team member
teamRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, experience, availability = 'Available', capacity = 100, email, phone, assignedProjects } = req.body;

    if (!name || !role || !email) {
      return res.status(400).json({ error: 'Name, role, and email are required' });
    }

    const member = await prisma.teamMember.create({
      data: {
        name,
        role,
        experience: experience || '3+ Years',
        availability,
        capacity: Number(capacity) || 100,
        email: email.toLowerCase(),
        phone: phone || null,
        assignedProjects: assignedProjects || '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
    });

    return res.status(201).json({ member });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'A team member with this email already exists' });
    }
    return res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Update team member
teamRouter.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, experience, availability, capacity, phone, assignedProjects } = req.body;

    const updated = await prisma.teamMember.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(experience && { experience }),
        ...(availability && { availability }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(phone !== undefined && { phone }),
        ...(assignedProjects !== undefined && { assignedProjects }),
      },
    });

    return res.json({ member: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update team member' });
  }
});

// Delete team member
teamRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.teamMember.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Team member deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete team member' });
  }
});
