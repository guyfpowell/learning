import { prisma } from '../db';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

export class SubscriptionService {
  async getAllPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { priceUsd: 'asc' },
    });
    return plans;
  }

  async getPlanById(planId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new AppError(
        ERROR_CODES.INVALID_PLAN,
        'Subscription plan not found',
        404
      );
    }

    return plan;
  }

  async getUserSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      // Return free plan if no subscription exists
      const freePlan = await prisma.subscriptionPlan.findUnique({
        where: { name: 'free' },
      });

      if (!freePlan) {
        throw new AppError(
          ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
          'No subscription found and free plan not available',
          404
        );
      }

      return {
        id: `free-${userId}`,
        userId,
        planId: freePlan.id,
        status: 'active',
        plan: freePlan,
        startedAt: new Date(),
      };
    }

    return subscription;
  }

  async createCheckoutSession(userId: string, planId: string) {
    // Verify plan exists
    const plan = await this.getPlanById(planId);

    if (plan.name === 'free') {
      throw new AppError(
        ERROR_CODES.INVALID_PLAN,
        'Cannot create checkout for free plan',
        400
      );
    }

    // For MVP, just create a subscription record
    // In production, this would integrate with Stripe
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        planId,
        status: 'active',
        renewedAt: new Date(),
      },
      create: {
        userId,
        planId,
        status: 'active',
        startedAt: new Date(),
      },
      include: { plan: true },
    });

    return {
      checkoutUrl: `https://checkout.stripe.com/pay/mock-session-${subscription.id}`,
      subscription,
    };
  }

  async upgradeSubscription(userId: string, newPlanId: string) {
    // Verify plan exists
    const newPlan = await this.getPlanById(newPlanId);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        planId: newPlanId,
        renewedAt: new Date(),
      },
      create: {
        userId,
        planId: newPlanId,
        status: 'active',
      },
      include: { plan: true },
    });

    // Log the event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        type: 'renewed',
        amount: newPlan.priceUsd,
      },
    });

    return subscription;
  }

  async cancelSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new AppError(
        ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
        'Subscription not found',
        404
      );
    }

    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'cancelled',
        expiresAt: new Date(),
      },
      include: { plan: true },
    });

    // Log the event
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        type: 'cancelled',
        amount: 0,
      },
    });

    return updated;
  }

  async getSubscriptionHistory(userId: string) {
    const events = await prisma.subscriptionEvent.findMany({
      where: { subscription: { userId } },
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return events;
  }
}

export const subscriptionService = new SubscriptionService();
