import { AIServiceClient, AIServiceError } from '../AIServiceClient';
import type { LessonRequest, CoachingRequest } from '@learning/shared';

const VALID_LESSON = {
  title: 'Python Variables',
  content: 'Variables store data in Python.',
  estimated_minutes: 5,
  key_takeaways: ['Variables are containers', 'Use = to assign'],
  quiz: {
    question: 'What is a variable?',
    options: ['A container', 'A loop', 'A function', 'A class'],
    correct_answer: 'A container',
    explanation: 'A variable stores a value.',
  },
};

const VALID_COACHING = {
  message: 'Great question! Variables store data.',
  suggestions: ['Try declaring a variable'],
};

const LESSON_REQUEST: LessonRequest = {
  skill_id: 'python-101',
  skill_level: 'beginner',
  topic: 'Variables',
  user_context: { goal: 'learn python' },
  tier: 'pro',
};

const COACHING_REQUEST: CoachingRequest = {
  messages: [{ role: 'user', content: 'What is a variable?' }],
  lesson_context: 'This lesson covers Python variables.',
  user_context: { goal: 'learn python' },
  tier: 'pro',
};

function makeFetch(status: number, body: unknown) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('AIServiceClient', () => {
  let client: AIServiceClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_SERVICE_URL = 'http://test-ai:8000';
    process.env.AI_SERVICE_API_KEY = 'test-key';
    process.env.AI_SERVICE_TIMEOUT_MS = '5000';
    client = new AIServiceClient();
  });

  afterEach(() => {
    delete process.env.AI_SERVICE_URL;
    delete process.env.AI_SERVICE_API_KEY;
    delete process.env.AI_SERVICE_TIMEOUT_MS;
  });

  describe('generateLesson', () => {
    it('returns LessonOutput on success', async () => {
      global.fetch = makeFetch(200, VALID_LESSON);

      const result = await client.generateLesson(LESSON_REQUEST);

      expect(result.title).toBe('Python Variables');
      expect(result.quiz.options).toHaveLength(4);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on 5xx and succeeds on the second attempt', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 503, json: jest.fn() })
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(VALID_LESSON),
        });

      const result = await client.generateLesson(LESSON_REQUEST);

      expect(result.title).toBe('Python Variables');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 10000);

    it('throws AIServiceError after all 3 attempts fail', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 500, json: jest.fn() });

      await expect(client.generateLesson(LESSON_REQUEST)).rejects.toThrow(AIServiceError);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    }, 10000);

    it('does not retry on 4xx', async () => {
      global.fetch = makeFetch(401, { detail: 'Unauthorized' });

      await expect(client.generateLesson(LESSON_REQUEST)).rejects.toMatchObject({
        kind: 'http_error',
        statusCode: 401,
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('throws validation error when response fails Zod schema', async () => {
      global.fetch = makeFetch(200, { title: 'ok', unexpected_field: true });

      await expect(client.generateLesson(LESSON_REQUEST)).rejects.toMatchObject({
        kind: 'validation',
      });
    });

    it('throws circuit_open error when circuit breaker is forced open', async () => {
      global.fetch = makeFetch(200, VALID_LESSON);
      client.breaker.open();

      await expect(client.generateLesson(LESSON_REQUEST)).rejects.toMatchObject({
        kind: 'circuit_open',
      });
      // fetch should not be called when circuit is open
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('coachingMessage', () => {
    it('returns CoachingOutput on success', async () => {
      global.fetch = makeFetch(200, VALID_COACHING);

      const result = await client.coachingMessage(COACHING_REQUEST);

      expect(result.message).toBe('Great question! Variables store data.');
      expect(result.suggestions).toHaveLength(1);
    });

    it('throws validation error when coaching response fails Zod schema', async () => {
      global.fetch = makeFetch(200, { wrong_field: 'bad' });

      await expect(client.coachingMessage(COACHING_REQUEST)).rejects.toMatchObject({
        kind: 'validation',
      });
    });
  });
});
