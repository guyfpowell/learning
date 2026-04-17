import { CoachingService } from '../CoachingService';
import { aiServiceClient } from '../AIServiceClient';
import { prisma } from '../../db';

jest.mock('../AIServiceClient', () => ({
  aiServiceClient: {
    coachingMessage: jest.fn(),
  },
}));

jest.mock('../../db', () => ({
  prisma: {
    generatedLesson: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const BASE_INPUT = {
  userId: 'u1',
  lessonId: 'l1',
  skillId: 's1',
  tier: 'pro',
  quizResult: {
    question: 'What is X?',
    userAnswer: 'A',
    correctAnswer: 'A',
    isCorrect: true,
    explanation: 'Because A is correct.',
  },
  lessonTitle: 'Intro to X',
  lessonContent: 'X is a concept...',
};

describe('CoachingService', () => {
  let service: CoachingService;

  beforeEach(() => {
    service = new CoachingService();
    jest.clearAllMocks();
    (prisma.generatedLesson.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.generatedLesson.upsert as jest.Mock).mockResolvedValue({});
    (aiServiceClient.coachingMessage as jest.Mock).mockResolvedValue({
      message: 'Great job! Keep going.',
      suggestions: [],
    });
  });

  it('returns null for free tier without calling AI', async () => {
    const result = await service.generateFeedback({ ...BASE_INPUT, tier: 'free' });
    expect(result).toBeNull();
    expect(aiServiceClient.coachingMessage).not.toHaveBeenCalled();
  });

  it('returns null for starter tier without calling AI', async () => {
    const result = await service.generateFeedback({ ...BASE_INPUT, tier: 'starter' });
    expect(result).toBeNull();
    expect(aiServiceClient.coachingMessage).not.toHaveBeenCalled();
  });

  it('returns coaching message for pro tier', async () => {
    const result = await service.generateFeedback(BASE_INPUT);
    expect(result).toBe('Great job! Keep going.');
    expect(aiServiceClient.coachingMessage).toHaveBeenCalledTimes(1);
  });

  it('returns coaching message for premium tier', async () => {
    const result = await service.generateFeedback({ ...BASE_INPUT, tier: 'premium' });
    expect(result).toBe('Great job! Keep going.');
  });

  it('returns cached message without calling AI when cache hit', async () => {
    (prisma.generatedLesson.findUnique as jest.Mock).mockResolvedValue({
      coachingMessage: 'Cached coaching.',
    });

    const result = await service.generateFeedback(BASE_INPUT);
    expect(result).toBe('Cached coaching.');
    expect(aiServiceClient.coachingMessage).not.toHaveBeenCalled();
  });

  it('returns null without throwing when AI service errors', async () => {
    (aiServiceClient.coachingMessage as jest.Mock).mockRejectedValue(new Error('AI down'));

    const result = await service.generateFeedback(BASE_INPUT);
    expect(result).toBeNull();
  });

  it('caches the coaching message after successful generation', async () => {
    await service.generateFeedback(BASE_INPUT);

    expect(prisma.generatedLesson.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_skillId: { userId: 'u1', skillId: 's1' } },
        update: { coachingMessage: 'Great job! Keep going.' },
      })
    );
  });
});
