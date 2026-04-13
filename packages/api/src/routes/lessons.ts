import { Router } from 'express';
import { lessonController } from '../controllers/LessonController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

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

// Submit quiz answers
router.post('/:id/quiz', (req, res, next) =>
  lessonController.submitQuiz(req, res, next)
);

// Get upcoming lessons
router.get('/', (req, res, next) =>
  lessonController.getUpcomingLessons(req, res, next)
);

export default router;
