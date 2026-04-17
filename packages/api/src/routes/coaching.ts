import { Router } from 'express';
import { coachingController } from '../controllers/CoachingController';
import { authMiddleware } from '../middleware/auth';
import { requirePlan } from '../middleware/plan';

const router = Router();

router.use(authMiddleware);
router.use(requirePlan('pro'));

router.post('/message', (req, res, next) =>
  coachingController.sendMessage(req, res, next)
);

export default router;
