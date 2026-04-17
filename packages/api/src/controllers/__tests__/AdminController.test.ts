import { AdminController } from '../AdminController';
import { adminService } from '../../services/AdminService';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/AdminService');

describe('AdminController', () => {
  let controller: AdminController;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    controller = new AdminController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  function makeReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
    return {
      user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      body: {},
      query: {},
      params: {},
      ...overrides,
    } as AuthenticatedRequest;
  }

  describe('listSkills', () => {
    it('returns 200 with skills', async () => {
      const skills = [{ id: 's1', name: 'Product Strategy' }];
      (adminService.listSkills as jest.Mock).mockResolvedValue(skills);

      await controller.listSkills(makeReq(), mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: skills }));
    });
  });

  describe('createSkill', () => {
    it('returns 201 on success', async () => {
      const created = { id: 's2', name: 'New Skill' };
      (adminService.createSkill as jest.Mock).mockResolvedValue(created);

      const req = makeReq({ body: { name: 'New Skill', description: 'D', category: 'product-management' } });
      await controller.createSkill(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('calls next with error when body is missing required fields', async () => {
      const req = makeReq({ body: {} });
      await controller.createSkill(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('listLessons', () => {
    it('returns 200 with paginated lessons', async () => {
      (adminService.listLessons as jest.Mock).mockResolvedValue({ lessons: [], total: 0 });

      await controller.listLessons(
        makeReq({ query: { page: '1' } }),
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteLesson', () => {
    it('returns 200 on soft delete', async () => {
      (adminService.deleteLesson as jest.Mock).mockResolvedValue({ id: 'l1', published: false });

      await controller.deleteLesson(
        makeReq({ params: { id: 'l1' } }),
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('listUsers', () => {
    it('returns 200 with paginated users', async () => {
      (adminService.listUsers as jest.Mock).mockResolvedValue({ users: [], total: 0 });

      await controller.listUsers(
        makeReq({ query: { page: '1' } }),
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getStats', () => {
    it('returns 200 with stats', async () => {
      (adminService.getStats as jest.Mock).mockResolvedValue({ totalUsers: 10, dau: 3, mrr: 0 });

      await controller.getStats(makeReq(), mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ totalUsers: 10 }) })
      );
    });
  });
});
