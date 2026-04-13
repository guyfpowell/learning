import { LessonService } from '../LessonService';
import { prisma } from '../../db';
import { AppError } from '../../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

jest.mock('../../db', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    userProgress: { findMany: jest.fn(), upsert: jest.fn() },
    lesson: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    quiz: { findMany: jest.fn() },
  },
}));

describe('LessonService', () => {
  let lessonService: LessonService;

  beforeEach(() => {
    lessonService = new LessonService();
    jest.clearAllMocks();
  });

  describe('getTodayLesson', () => {
    it('should return the next incomplete lesson for a user', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';
      const mockUser = { id: userId, email: 'test@test.com', name: 'Test' };
      const mockLesson = {
        id: lessonId,
        title: 'Test Lesson',
        content: 'Test content',
        durationMinutes: 5,
        skillPathId: 'path-1',
        day: 1,
        mediaUrl: null,
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date(),
        skillPath: { id: 'path-1' },
        quizzes: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        profile: { timezone: 'UTC' },
      });

      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'progress-1',
          userId,
          lessonId,
          completedAt: null,
          quizScore: null,
          streakCount: 0,
          lastLessonDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lesson: mockLesson,
        },
      ]);

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);

      const result = await lessonService.getTodayLesson(userId);

      expect(result).toEqual(mockLesson);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { profile: true },
      });
    });

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(lessonService.getTodayLesson(userId)).rejects.toThrow(AppError);
    });

    it('should return first available lesson if all are completed', async () => {
      const userId = 'user-1';
      const mockLesson = {
        id: 'lesson-1',
        title: 'Test Lesson',
        content: 'Test content',
        durationMinutes: 5,
        skillPathId: 'path-1',
        day: 1,
        mediaUrl: null,
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date(),
        skillPath: { id: 'path-1' },
        quizzes: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        profile: { timezone: 'UTC' },
      });

      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'progress-1',
          userId,
          lessonId: 'lesson-1',
          completedAt: new Date(),
          quizScore: 95,
          streakCount: 5,
          lastLessonDate: new Date(),
          lesson: mockLesson,
        },
      ]);

      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockLesson);

      const result = await lessonService.getTodayLesson(userId);

      expect(result).toEqual(mockLesson);
    });
  });

  describe('getLessonById', () => {
    it('should return lesson with quizzes', async () => {
      const lessonId = 'lesson-1';
      const mockLesson = {
        id: lessonId,
        title: 'Test Lesson',
        content: 'Test content',
        durationMinutes: 5,
        skillPathId: 'path-1',
        day: 1,
        mediaUrl: null,
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date(),
        skillPath: { id: 'path-1' },
        quizzes: [
          {
            id: 'quiz-1',
            lessonId,
            type: 'multiple-choice',
            question: 'What is 2+2?',
            options: ['3', '4', '5'],
            correctAnswer: '4',
            explanation: 'Basic math',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);

      const result = await lessonService.getLessonById(lessonId);

      expect(result).toEqual(mockLesson);
      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: lessonId },
        include: { skillPath: true, quizzes: true },
      });
    });

    it('should throw error if lesson not found', async () => {
      const lessonId = 'nonexistent';
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(lessonService.getLessonById(lessonId)).rejects.toThrow(AppError);
    });
  });

  describe('completeLessonService', () => {
    it('should mark lesson as complete and update streak', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue({
        id: lessonId,
      });

      const mockProgress = {
        id: 'progress-1',
        userId,
        lessonId,
        completedAt: new Date(),
        quizScore: null,
        streakCount: 1,
        lastLessonDate: new Date(),
        lesson: { id: lessonId },
      };

      (prisma.userProgress.upsert as jest.Mock).mockResolvedValue(mockProgress);

      const result = await lessonService.completeLessonService(userId, lessonId);

      expect(result).toEqual(mockProgress);
      expect(prisma.userProgress.upsert).toHaveBeenCalled();
    });

    it('should throw error if lesson not found', async () => {
      const userId = 'user-1';
      const lessonId = 'nonexistent';

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        lessonService.completeLessonService(userId, lessonId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('submitQuiz', () => {
    it('should score quiz correctly and return score', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';
      const answers = {
        'quiz-1': '4',
        'quiz-2': 'wrong-answer',
      };

      const quizzes = [
        {
          id: 'quiz-1',
          lessonId,
          type: 'multiple-choice',
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: '4',
          explanation: 'Basic math',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'quiz-2',
          lessonId,
          type: 'multiple-choice',
          question: 'Capital of France?',
          options: ['London', 'Berlin', 'Paris'],
          correctAnswer: 'correct-answer',
          explanation: 'Paris is the capital',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.quiz.findMany as jest.Mock).mockResolvedValue(quizzes);

      const mockProgress = {
        id: 'progress-1',
        userId,
        lessonId,
        completedAt: new Date(),
        quizScore: 50,
        streakCount: 1,
        lastLessonDate: new Date(),
      };

      (prisma.userProgress.upsert as jest.Mock).mockResolvedValue(mockProgress);

      const mockLesson = {
        id: lessonId,
        title: 'Test Lesson',
        content: 'Test content',
        durationMinutes: 5,
        skillPathId: 'path-1',
        day: 1,
        mediaUrl: null,
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson);

      const result = await lessonService.submitQuiz(userId, lessonId, answers);

      expect(result.score).toBe(50);
      expect(result.feedbacks).toHaveLength(2);
      expect(result.feedbacks[0].isCorrect).toBe(true);
      expect(result.feedbacks[1].isCorrect).toBe(false);
    });

    it('should throw error if no quizzes found for lesson', async () => {
      const userId = 'user-1';
      const lessonId = 'lesson-1';

      (prisma.quiz.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        lessonService.submitQuiz(userId, lessonId, {})
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUpcomingLessons', () => {
    it('should return upcoming lessons with limit', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          title: 'Lesson 1',
          content: 'Content 1',
          durationMinutes: 5,
          skillPathId: 'path-1',
          day: 1,
          mediaUrl: null,
          difficulty: 'beginner',
          createdAt: new Date(),
          updatedAt: new Date(),
          skillPath: { id: 'path-1' },
          quizzes: [],
        },
        {
          id: 'lesson-2',
          title: 'Lesson 2',
          content: 'Content 2',
          durationMinutes: 5,
          skillPathId: 'path-1',
          day: 2,
          mediaUrl: null,
          difficulty: 'beginner',
          createdAt: new Date(),
          updatedAt: new Date(),
          skillPath: { id: 'path-1' },
          quizzes: [],
        },
      ];

      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);

      const result = await lessonService.getUpcomingLessons('user-1', 5);

      expect(result).toEqual(mockLessons);
      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        take: 5,
        include: { skillPath: true, quizzes: true },
      });
    });
  });
});
