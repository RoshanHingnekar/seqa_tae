import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const notificationsRouter = Router();

// Get notifications
notificationsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
notificationsRouter.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return res.json({ notification: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
notificationsRouter.put('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});
