import { adminGuard } from '../adminGuard';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth';

describe('adminGuard', () => {
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('calls next() when user has admin role', () => {
    const req = {
      user: { id: 'user-1', email: 'admin@test.com', role: 'admin' },
    } as AuthenticatedRequest;

    adminGuard(req, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user has user role', () => {
    const req = {
      user: { id: 'user-1', email: 'user@test.com', role: 'user' },
    } as AuthenticatedRequest;

    adminGuard(req, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when no user on request', () => {
    const req = { user: undefined } as AuthenticatedRequest;

    adminGuard(req, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
