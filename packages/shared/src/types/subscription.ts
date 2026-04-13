export interface SubscriptionPlan {
  id: string;
  name: 'free' | 'starter' | 'pro' | 'premium';
  priceUsd: number;
  billingCycle: 'monthly' | 'annual';
  features: string[];
  lessonsPerDay: number;
  maxSkillPaths: number;
  aiCoachingIncluded: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  startedAt: Date;
  renewedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionEvent {
  id: string;
  userId: string;
  type: 'subscribed' | 'renewed' | 'cancelled' | 'refunded';
  planId: string;
  amount: number;
  stripeEventId?: string;
  createdAt: Date;
}
