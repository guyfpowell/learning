import { CoachingController } from '../CoachingController';
import { aiServiceClient, AIServiceError } from '../../services/AIServiceClient';
import { Response, NextFunction } from 'express';
import { PlanRequest } from '../../middleware/plan';

jest.mock('../../services/AIServiceClient', () => ({
  aiServiceClient: {
    coachingMessage: jest.fn(),
  },
  AIServiceError: class AIServiceError extends Error {
    constructor(
      public readonly kind: string,
      message: string
    ) {
      super(message);
      this.name = 'AIServiceError';
    }
  },
}));

const VALID_COACHING_OUTPUT = {
  message: 'A variable stores data.',
  suggestions: ['Declare your own variable'],
};

describe('CoachingController', () => {
  let controller: CoachingController;
  let mockReq: Partial<PlanRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    controller = new CoachingController();
    mockReq = {
      user: { id: 'user-1', email: 'test@test.com', role: 'user' as const },
      planName: 'pro',
      body: {
        messages: [{ role: 'user', content: 'What is a variable?' }],
        lesson_context: 'This lesson covers Python variables.',
        user_context: { goal: 'learn python' },
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('returns 200 with coaching output on success', async () => {
      (aiServiceClient.coachingMessage as jest.Mock).mockResolvedValue(
        VALID_COACHING_OUTPUT
      );

      await controller.sendMessage(
        mockReq as PlanRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: VALID_COACHING_OUTPUT,
        })
      );
    });

    it('passes tier from req.planName to AI service', async () => {
      (aiServiceClient.coachingMessage as jest.Mock).mockResolvedValue(
        VALID_COACHING_OUTPUT
      );
      mockReq.planName = 'premium';

      await controller.sendMessage(
        mockReq as PlanRequest,
        mockRes as Response,
        mockNext
      );

      expect(aiServiceClient.coachingMessage).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 'premium' })
      );
    });

    it('returns 503 when AI service throws AIServiceError', async () => {
      (aiServiceClient.coachingMessage as jest.Mock).mockRejectedValue(
        new AIServiceError('circuit_open', 'circuit is open')
      );

      await controller.sendMessage(
        mockReq as PlanRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('returns 400 when messages is missing', async () => {
      mockReq.body = { lesson_context: 'some context' };

      await controller.sendMessage(
        mockReq as PlanRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('returns 400 when lesson_context is missing', async () => {
      mockReq.body = { messages: [{ role: 'user', content: 'hi' }] };

      await controller.sendMessage(
        mockReq as PlanRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it('returns 401 when no user on request', async () => {
      mockReq.user = undefined;

      await controller.sendMessage(
        mockReq as PlanRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      );
    });
  });
});
