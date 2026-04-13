import { Router } from 'express';
import { notificationPreferenceController } from '../controllers/NotificationPreferenceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All notification preference routes are protected
router.use(authMiddleware);

// Get user notification preferences
router.get('/preferences', (req, res, next) =>
  notificationPreferenceController.getPreferences(req, res, next)
);

// Update user notification preferences
router.patch('/preferences', (req, res, next) =>
  notificationPreferenceController.updatePreferences(req, res, next)
);

export default router;
