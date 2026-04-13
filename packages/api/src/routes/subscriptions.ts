import { Router } from 'express';
import { subscriptionController } from '../controllers/SubscriptionController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Public route - get all plans
router.get('/plans', optionalAuthMiddleware, (req, res, next) =>
  subscriptionController.getAllPlans(req, res, next)
);

// Protected routes
router.use(authMiddleware);

// Get current subscription status
router.get('/status', (req, res, next) =>
  subscriptionController.getSubscriptionStatus(req, res, next)
);

// Create checkout session
router.post('/checkout', (req, res, next) =>
  subscriptionController.createCheckout(req, res, next)
);

// Upgrade subscription
router.post('/upgrade', (req, res, next) =>
  subscriptionController.upgradeSubscription(req, res, next)
);

// Cancel subscription
router.post('/cancel', (req, res, next) =>
  subscriptionController.cancelSubscription(req, res, next)
);

// Get subscription history
router.get('/history', (req, res, next) =>
  subscriptionController.getSubscriptionHistory(req, res, next)
);

export default router;
