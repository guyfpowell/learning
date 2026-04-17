import { requirePlan } from '../plan';
import { subscriptionService } from '../../services/SubscriptionService';
import { Response, NextFunction } from 'express';
import { PlanRequest } from '../plan';

jest.mock('../../services/SubscriptionService');

function makeSubscription(planName: string) {
  return {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    status: 'active',
    plan: { id: 'plan-1', name: planName },
  };
}

describe('requirePlan middleware', () => {
  let mockReq: Partial<PlanRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { user: { id: 'user-1', email: 'test@test.com' } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('calls next() when user has the required plan', async () => {
    (subscriptionService.getUserSubscription as jest.Mock).mockResolvedValue(
      makeSubscription('pro')
    );

    await requirePlan('pro')(
      mockReq as PlanRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.planName).toBe('pro');
  });

  it('calls next() when user has a higher plan than required', async () => {
    (subscriptionService.getUserSubscription as jest.Mock).mockResolvedValue(
      makeSubscription('premium')
    );

    await requirePlan('pro')(
      mockReq as PlanRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.planName).toBe('premium');
  });

  it('returns 403 when user plan is below minimum', async () => {
    (subscriptionService.getUserSubscription as jest.Mock).mockResolvedValue(
      makeSubscription('free')
    );

    await requirePlan('pro')(
      mockReq as PlanRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when no user on request', async () => {
    mockReq.user = undefined;

    await requirePlan('pro')(
      mockReq as PlanRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next with error when subscription lookup throws', async () => {
    (subscriptionService.getUserSubscription as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    await requirePlan('pro')(
      mockReq as PlanRequest,
      mockRes as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
