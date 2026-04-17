import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { subscriptionService } from '../services/SubscriptionService';
import { ERROR_CODES } from '@learning/shared';

export type PlanName = 'free' | 'starter' | 'pro' | 'premium';

const PLAN_ORDER: Record<PlanName, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  premium: 3,
};

export interface PlanRequest extends AuthenticatedRequest {
  planName?: PlanName;
}

/**
 * Non-blocking middleware: detects subscription tier and sets req.planName.
 * Does NOT block any tier. Use on routes that are open to all tiers but need
 * tier-aware behaviour (e.g. quiz coaching feedback for pro/premium users).
 */
export async function detectPlan(req: PlanRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next();
    return;
  }
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user.id);
    req.planName = subscription.plan.name as PlanName;
  } catch {
    req.planName = 'free';
  }
  next();
}

export function requirePlan(minimumPlan: PlanName) {
  return async (req: PlanRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Missing authentication token',
        code: ERROR_CODES.AUTH_MISSING_TOKEN,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      const subscription = await subscriptionService.getUserSubscription(req.user.id);
      const planName = subscription.plan.name as PlanName;

      if ((PLAN_ORDER[planName] ?? 0) < PLAN_ORDER[minimumPlan]) {
        res.status(403).json({
          success: false,
          error: `This feature requires a ${minimumPlan} plan or higher`,
          code: ERROR_CODES.SUBSCRIPTION_INACTIVE,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      req.planName = planName;
      next();
    } catch (err) {
      next(err);
    }
  };
}
