import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES, type CoachingRequest } from '@learning/shared';
import { PlanRequest } from '../middleware/plan';
import { aiServiceClient, AIServiceError } from '../services/AIServiceClient';

export class CoachingController {
  async sendMessage(req: PlanRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const { messages, lesson_context, user_context } = req.body;

      if (!messages || !Array.isArray(messages)) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'messages array is required',
          400
        );
      }

      if (!lesson_context || typeof lesson_context !== 'string') {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'lesson_context is required',
          400
        );
      }

      const request: CoachingRequest = {
        messages,
        lesson_context,
        user_context: user_context || {},
        tier: req.planName || 'free',
      };

      try {
        const output = await aiServiceClient.coachingMessage(request);
        res.status(200).json({
          success: true,
          data: output,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        if (err instanceof AIServiceError) {
          res.status(503).json({
            success: false,
            error: 'AI coaching is temporarily unavailable',
            code: ERROR_CODES.SERVICE_UNAVAILABLE,
            timestamp: new Date().toISOString(),
          });
          return;
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
}

export const coachingController = new CoachingController();
