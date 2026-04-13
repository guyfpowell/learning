import { UserController } from '../UserController';
import { userService } from '../../services/UserService';
import { AppError } from '../../middleware/error-handler';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/UserService');

describe('UserController', () => {
  let userController: UserController;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    userController = new UserController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const req = {
        user: { id: 'user-1' },
        body: {
          goal: 'ai-strategy',
          timezone: 'UTC',
          preferredTime: 'morning',
        },
      } as any;

      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        goal: 'ai-strategy',
        timezone: 'UTC',
        preferredTime: 'morning',
      };

      (userService.updateProfile as jest.Mock).mockResolvedValue(mockProfile);

      await userController.updateProfile(req, mockRes as Response, mockNext);

      expect(userService.updateProfile).toHaveBeenCalledWith('user-1', {
        goal: 'ai-strategy',
        timezone: 'UTC',
        preferredTime: 'morning',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfile,
        })
      );
    });

    it('should return 401 if no user in request', async () => {
      const req = {
        user: null,
        body: {},
      } as any;

      await userController.updateProfile(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getProgress', () => {
    it('should return user progress stats', async () => {
      const req = {
        user: { id: 'user-1' },
      } as any;

      const mockProgress = {
        totalLessonsCompleted: 5,
        currentStreak: 3,
        averageScore: 85,
        lastLessonDate: new Date(),
      };

      (userService.getUserProgress as jest.Mock).mockResolvedValue(mockProgress);

      await userController.getProgress(req, mockRes as Response, mockNext);

      expect(userService.getUserProgress).toHaveBeenCalledWith('user-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProgress,
        })
      );
    });

    it('should return 401 if no user in request', async () => {
      const req = { user: null } as any;

      await userController.getProgress(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
