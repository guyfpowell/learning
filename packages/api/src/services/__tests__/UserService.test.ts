import { UserService } from '../UserService';
import { prisma } from '../../db';
import { AppError } from '../../middleware/error-handler';

jest.mock('../../db', () => ({
  prisma: {
    userProfile: { update: jest.fn() },
    userProgress: { findMany: jest.fn() },
  },
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update user profile with provided fields', async () => {
      const userId = 'user-1';
      const updateData = {
        goal: 'ai-strategy',
        timezone: 'America/New_York',
        preferredTime: 'morning',
        learningStyle: 'visual',
      };

      const mockProfile = {
        id: 'profile-1',
        userId,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          email: 'test@test.com',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date(),
          passwordHash: 'hash',
        },
      };

      (prisma.userProfile.update as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userService.updateProfile(userId, updateData);

      expect(result).toEqual(mockProfile);
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: updateData,
        include: { user: true },
      });
    });

    it('should update only provided fields', async () => {
      const userId = 'user-1';
      const updateData = { timezone: 'UTC' };

      const mockProfile = {
        id: 'profile-1',
        userId,
        goal: null,
        timezone: 'UTC',
        preferredTime: null,
        learningStyle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: userId },
      };

      (prisma.userProfile.update as jest.Mock).mockResolvedValue(mockProfile);

      const result = await userService.updateProfile(userId, updateData);

      expect(result.timezone).toBe('UTC');
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: updateData,
        include: { user: true },
      });
    });
  });

  describe('getUserProgress', () => {
    it('should return aggregated progress stats', async () => {
      const userId = 'user-1';
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockProgress = [
        {
          id: 'progress-1',
          userId,
          lessonId: 'lesson-1',
          completedAt: yesterday,
          quizScore: 85,
          streakCount: 5,
          lastLessonDate: yesterday,
          createdAt: new Date(),
          updatedAt: new Date(),
          lesson: { id: 'lesson-1', title: 'Lesson 1' },
        },
        {
          id: 'progress-2',
          userId,
          lessonId: 'lesson-2',
          completedAt: now,
          quizScore: 95,
          streakCount: 6,
          lastLessonDate: now,
          createdAt: new Date(),
          updatedAt: new Date(),
          lesson: { id: 'lesson-2', title: 'Lesson 2' },
        },
        {
          id: 'progress-3',
          userId,
          lessonId: 'lesson-3',
          completedAt: null,
          quizScore: null,
          streakCount: 0,
          lastLessonDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lesson: { id: 'lesson-3', title: 'Lesson 3' },
        },
      ];

      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue(mockProgress);

      const result = await userService.getUserProgress(userId);

      expect(result.totalLessonsCompleted).toBe(2);
      expect(result.currentStreak).toBe(6);
      expect(result.averageScore).toBe(90);
      expect(result.lastLessonDate).toEqual(now);
    });

    it('should return zero stats for user with no progress', async () => {
      const userId = 'user-1';

      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([]);

      const result = await userService.getUserProgress(userId);

      expect(result.totalLessonsCompleted).toBe(0);
      expect(result.currentStreak).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.lastLessonDate).toBeNull();
    });

    it('should calculate average score from completed lessons only', async () => {
      const userId = 'user-1';

      const mockProgress = [
        {
          id: 'progress-1',
          userId,
          lessonId: 'lesson-1',
          completedAt: new Date(),
          quizScore: 80,
          streakCount: 1,
          lastLessonDate: new Date(),
          lesson: { id: 'lesson-1' },
        },
        {
          id: 'progress-2',
          userId,
          lessonId: 'lesson-2',
          completedAt: new Date(),
          quizScore: 90,
          streakCount: 2,
          lastLessonDate: new Date(),
          lesson: { id: 'lesson-2' },
        },
        {
          id: 'progress-3',
          userId,
          lessonId: 'lesson-3',
          completedAt: new Date(),
          quizScore: 100,
          streakCount: 3,
          lastLessonDate: new Date(),
          lesson: { id: 'lesson-3' },
        },
      ];

      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue(mockProgress);

      const result = await userService.getUserProgress(userId);

      expect(result.averageScore).toBe(90); // (80 + 90 + 100) / 3 = 90
    });

    it('should get current streak from most recent completed lesson', async () => {
      const userId = 'user-1';
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockProgress = [
        {
          id: 'progress-1',
          userId,
          lessonId: 'lesson-1',
          completedAt: yesterday,
          quizScore: 85,
          streakCount: 5,
          lastLessonDate: yesterday,
          lesson: { id: 'lesson-1' },
        },
        {
          id: 'progress-2',
          userId,
          lessonId: 'lesson-2',
          completedAt: now,
          quizScore: 90,
          streakCount: 10, // This is the most recent, should be returned
          lastLessonDate: now,
          lesson: { id: 'lesson-2' },
        },
      ];

      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue(mockProgress);

      const result = await userService.getUserProgress(userId);

      expect(result.currentStreak).toBe(10);
    });
  });
});
