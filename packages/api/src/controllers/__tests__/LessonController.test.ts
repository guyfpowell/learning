import { LessonController } from '../LessonController';
import { lessonService } from '../../services/LessonService';
import { AppError } from '../../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/LessonService');

describe('LessonController', () => {
  let lessonController: LessonController;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    lessonController = new LessonController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getTodayLesson', () => {
    it('should return today lesson successfully', async () => {
      const req = {
        user: { id: 'user-1', email: 'test@test.com', role: 'user' as const },
      } as AuthenticatedRequest;

      const mockLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        content: 'Test content',
        durationMinutes: 5,
      };

      (lessonService.getTodayLesson as jest.Mock).mockResolvedValue(mockLesson);

      await lessonController.getTodayLesson(req, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockLesson,
        })
      );
    });

    it('should return 401 if no user in request', async () => {
      const req = { user: null } as any;

      await lessonController.getTodayLesson(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getLesson', () => {
    it('should return lesson by ID', async () => {
      const req = {
        user: { id: 'user-1' },
        params: { id: 'lesson-1' },
      } as any;

      const mockLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        content: 'Content',
      };

      (lessonService.getLessonById as jest.Mock).mockResolvedValue(mockLesson);

      await lessonController.getLesson(req, mockRes as Response, mockNext);

      expect(lessonService.getLessonById).toHaveBeenCalledWith('lesson-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if lesson ID missing', async () => {
      const req = {
        user: { id: 'user-1' },
        params: {},
      } as any;

      await lessonController.getLesson(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('completeLesson', () => {
    it('should mark lesson as complete', async () => {
      const req = {
        user: { id: 'user-1' },
        params: { id: 'lesson-1' },
      } as any;

      const mockProgress = {
        id: 'progress-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        completedAt: new Date(),
        streakCount: 1,
      };

      (lessonService.completeLessonService as jest.Mock).mockResolvedValue(
        mockProgress
      );

      await lessonController.completeLesson(req, mockRes as Response, mockNext);

      expect(lessonService.completeLessonService).toHaveBeenCalledWith(
        'user-1',
        'lesson-1'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('submitQuiz', () => {
    it('submits quiz and passes tier from planName', async () => {
      const req = {
        user: { id: 'user-1' },
        params: { id: 'lesson-1' },
        body: { answers: { 'quiz-1': '4' } },
        planName: 'pro',
      } as any;

      const mockResult = {
        score: 100,
        feedbacks: [{ isCorrect: true }],
        lesson: { id: 'lesson-1' },
        coaching: 'Great work!',
      };

      (lessonService.submitQuiz as jest.Mock).mockResolvedValue(mockResult);

      await lessonController.submitQuiz(req, mockRes as Response, mockNext);

      expect(lessonService.submitQuiz).toHaveBeenCalledWith(
        'user-1',
        'lesson-1',
        { 'quiz-1': '4' },
        'pro'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ coaching: 'Great work!' }),
        })
      );
    });

    it('defaults to free tier when planName not set', async () => {
      const req = {
        user: { id: 'user-1' },
        params: { id: 'lesson-1' },
        body: { answers: {} },
        // planName not set
      } as any;

      (lessonService.submitQuiz as jest.Mock).mockResolvedValue({
        score: 0, feedbacks: [], lesson: {}, coaching: null,
      });

      await lessonController.submitQuiz(req, mockRes as Response, mockNext);

      expect(lessonService.submitQuiz).toHaveBeenCalledWith(
        'user-1', 'lesson-1', {}, 'free'
      );
    });

    it('returns 400 if answers missing', async () => {
      const req = {
        user: { id: 'user-1' },
        params: { id: 'lesson-1' },
        body: {},
      } as any;

      await lessonController.submitQuiz(req, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getUpcomingLessons', () => {
    it('should return upcoming lessons with default limit', async () => {
      const req = {
        user: { id: 'user-1' },
        query: {},
      } as any;

      const mockLessons = [
        { id: 'lesson-1', title: 'Lesson 1' },
        { id: 'lesson-2', title: 'Lesson 2' },
      ];

      (lessonService.getUpcomingLessons as jest.Mock).mockResolvedValue(
        mockLessons
      );

      await lessonController.getUpcomingLessons(
        req,
        mockRes as Response,
        mockNext
      );

      expect(lessonService.getUpcomingLessons).toHaveBeenCalledWith('user-1', 5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should respect custom limit', async () => {
      const req = {
        user: { id: 'user-1' },
        query: { limit: '10' },
      } as any;

      const mockLessons = Array(10).fill({ id: 'lesson' });

      (lessonService.getUpcomingLessons as jest.Mock).mockResolvedValue(
        mockLessons
      );

      await lessonController.getUpcomingLessons(
        req,
        mockRes as Response,
        mockNext
      );

      expect(lessonService.getUpcomingLessons).toHaveBeenCalledWith('user-1', 10);
    });
  });
});
