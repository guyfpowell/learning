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

jest.mock('../../ai/SkillTracker', () => ({
  skillTracker: { updateRating: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../ai/RecommendationEngine', () => ({
  recommendationEngine: { getNextLesson: jest.fn() },
}));

jest.mock('../../ai/LearningStyleClassifier', () => ({
  learningStyleClassifier: { classify: jest.fn().mockReturnValue('general') },
}));

jest.mock('../EngagementService', () => ({
  engagementService: {
    recordEngagement: jest.fn().mockResolvedValue(undefined),
    getEngagementSignals: jest.fn().mockResolvedValue({
      avgCompletionRatio: 1.0,
      avgFirstAttemptAccuracy: 0.5,
      avgRevisitCount: 0,
    }),
  },
}));

jest.mock('../CoachingService', () => ({
  coachingService: { generateFeedback: jest.fn().mockResolvedValue(null) },
}));

jest.mock('../UserService', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    updateProfile: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { recommendationEngine } from '../../ai/RecommendationEngine';
import { coachingService } from '../CoachingService';

const MOCK_LESSON = {
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
  skillPath: { id: 'path-1', skillId: 'skill-1' },
  quizzes: [],
};

describe('LessonService', () => {
  let lessonService: LessonService;

  beforeEach(() => {
    lessonService = new LessonService();
    jest.clearAllMocks();
    (recommendationEngine.getNextLesson as jest.Mock).mockResolvedValue('lesson-1');
    (coachingService.generateFeedback as jest.Mock).mockResolvedValue(null);
  });

  describe('getTodayLesson', () => {
    it('returns the recommended lesson for a user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        profile: { timezone: 'UTC' },
      });
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        { lessonId: 'lesson-1', completedAt: null, lesson: MOCK_LESSON },
      ]);
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(MOCK_LESSON);

      const result = await lessonService.getTodayLesson('user-1');

      expect(result.id).toBe('lesson-1');
      expect(recommendationEngine.getNextLesson).toHaveBeenCalledWith('user-1', 'path-1');
    });

    it('throws if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(lessonService.getTodayLesson('bad-user')).rejects.toThrow(AppError);
    });

    it('returns first available lesson if all completed', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', profile: {} });
      (prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
        { lessonId: 'lesson-1', completedAt: new Date(), lesson: MOCK_LESSON },
      ]);
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(MOCK_LESSON);

      const result = await lessonService.getTodayLesson('u1');
      expect(result.id).toBe('lesson-1');
    });
  });

  describe('getLessonById', () => {
    it('returns lesson with quizzes', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(MOCK_LESSON);
      const result = await lessonService.getLessonById('lesson-1');
      expect(result).toEqual(MOCK_LESSON);
      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        include: { skillPath: true, quizzes: true },
      });
    });

    it('throws if lesson not found', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(lessonService.getLessonById('bad')).rejects.toThrow(AppError);
    });
  });

  describe('completeLessonService', () => {
    it('marks lesson complete and returns progress', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue({ id: 'lesson-1' });
      const mockProgress = { id: 'p1', completedAt: new Date(), lesson: { id: 'lesson-1' } };
      (prisma.userProgress.upsert as jest.Mock).mockResolvedValue(mockProgress);

      const result = await lessonService.completeLessonService('u1', 'lesson-1');
      expect(result).toEqual(mockProgress);
      expect(prisma.userProgress.upsert).toHaveBeenCalled();
    });

    it('throws if lesson not found', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(lessonService.completeLessonService('u1', 'bad')).rejects.toThrow(AppError);
    });
  });

  describe('submitQuiz', () => {
    const QUIZZES = [
      {
        id: 'quiz-1',
        lessonId: 'lesson-1',
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        explanation: 'Basic math',
      },
      {
        id: 'quiz-2',
        lessonId: 'lesson-1',
        question: 'Capital of France?',
        options: ['London', 'Berlin', 'Paris'],
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital',
      },
    ];

    beforeEach(() => {
      (prisma.quiz.findMany as jest.Mock).mockResolvedValue(QUIZZES);
      (prisma.userProgress.upsert as jest.Mock).mockResolvedValue({});
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(MOCK_LESSON);
    });

    it('scores quiz correctly and returns result', async () => {
      const result = await lessonService.submitQuiz(
        'u1',
        'lesson-1',
        { 'quiz-1': '4', 'quiz-2': 'wrong' }
      );

      expect(result.score).toBe(50);
      expect(result.feedbacks[0].isCorrect).toBe(true);
      expect(result.feedbacks[1].isCorrect).toBe(false);
    });

    it('throws if no quizzes found', async () => {
      (prisma.quiz.findMany as jest.Mock).mockResolvedValue([]);
      await expect(lessonService.submitQuiz('u1', 'lesson-1', {})).rejects.toThrow(AppError);
    });

    it('includes coaching response when pro tier and AI returns message', async () => {
      (coachingService.generateFeedback as jest.Mock).mockResolvedValue('Great work!');

      const result = await lessonService.submitQuiz('u1', 'lesson-1', { 'quiz-1': '4', 'quiz-2': 'Paris' }, 'pro');

      expect(result.coaching).toBe('Great work!');
    });

    it('includes null coaching for free tier', async () => {
      const result = await lessonService.submitQuiz('u1', 'lesson-1', { 'quiz-1': '4', 'quiz-2': 'Paris' }, 'free');
      expect(result.coaching).toBeNull();
    });

    it('returns coaching field even when AI fails (null, not thrown)', async () => {
      (coachingService.generateFeedback as jest.Mock).mockResolvedValue(null);

      const result = await lessonService.submitQuiz('u1', 'lesson-1', {}, 'pro').catch(() => null);
      // Will throw for missing quizzes — use default mock with quizzes
      const r = await lessonService.submitQuiz('u1', 'lesson-1', { 'quiz-1': '4', 'quiz-2': 'Paris' }, 'pro');
      expect(r.coaching).toBeNull();
    });
  });

  describe('getUpcomingLessons', () => {
    it('returns lessons with limit', async () => {
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([MOCK_LESSON]);
      const result = await lessonService.getUpcomingLessons('u1', 5);
      expect(result).toHaveLength(1);
      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        take: 5,
        include: { skillPath: true, quizzes: true },
      });
    });
  });
});
