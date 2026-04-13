import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { subscriptionService } from '../services/SubscriptionService';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

export class SubscriptionController {
  async getAllPlans(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const plans = await subscriptionService.getAllPlans();

      res.status(200).json({
        success: true,
        data: plans,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const subscription = await subscriptionService.getUserSubscription(
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: subscription,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async createCheckout(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const { planId } = req.body;

      if (!planId) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Plan ID is required',
          400
        );
      }

      const result = await subscriptionService.createCheckoutSession(
        req.user.id,
        planId
      );

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async upgradeSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const { planId } = req.body;

      if (!planId) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Plan ID is required',
          400
        );
      }

      const subscription = await subscriptionService.upgradeSubscription(
        req.user.id,
        planId
      );

      res.status(200).json({
        success: true,
        data: {
          message: 'Subscription upgraded successfully',
          subscription,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const subscription = await subscriptionService.cancelSubscription(
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: {
          message: 'Subscription cancelled',
          subscription,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const events = await subscriptionService.getSubscriptionHistory(
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: events,
        pagination: {
          total: events.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
