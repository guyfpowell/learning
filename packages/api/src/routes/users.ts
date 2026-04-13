import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All user routes are protected
router.use(authMiddleware);

// Get current user (via auth controller, but include here for reference)
// GET /users/me -> handled in auth routes

// Update user profile
router.patch('/profile', (req, res, next) =>
  userController.updateProfile(req, res, next)
);

// Get user progress
router.get('/progress', (req, res, next) =>
  userController.getProgress(req, res, next)
);

export default router;
