import { Router } from 'express';
import { lessonController } from '../controllers/LessonController';
import { authMiddleware } from '../middleware/auth';
import { detectPlan } from '../middleware/plan';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Skills with team-aware path visibility (Phase 10.4)
router.get('/skills', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const memberships = await prisma.teamMember.findMany({ where: { userId }, select: { teamId: true } });
    const teamIds = memberships.map((m) => m.teamId);

    const skills = await prisma.skill.findMany({
      include: {
        skillPaths: {
          where: { OR: [{ teamId: null }, { teamId: { in: teamIds } }] },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: skills });
  } catch (err) { next(err); }
});

// All lesson routes are protected
router.use(authMiddleware);

// Get today's lesson
router.get('/today', (req, res, next) =>
  lessonController.getTodayLesson(req, res, next)
);

// Get specific lesson
router.get('/:id', (req, res, next) =>
  lessonController.getLesson(req, res, next)
);

// Mark lesson as complete
router.post('/:id/complete', (req, res, next) =>
  lessonController.completeLesson(req, res, next)
);

// Submit quiz answers — detectPlan enriches req.planName for coaching (non-blocking)
router.post('/:id/quiz', detectPlan, (req, res, next) =>
  lessonController.submitQuiz(req, res, next)
);

// Get upcoming lessons
router.get('/', (req, res, next) =>
  lessonController.getUpcomingLessons(req, res, next)
);

export default router;
