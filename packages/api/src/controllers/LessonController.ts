import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { lessonService } from '../services/LessonService';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES } from '@learning/shared';

export class LessonController {
  async getTodayLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const lesson = await lessonService.getTodayLesson(req.user.id);

      res.status(200).json({
        success: true,
        data: lesson,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Lesson ID is required',
          400
        );
      }

      const lesson = await lessonService.getLessonById(id);

      res.status(200).json({
        success: true,
        data: lesson,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async completeLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const { id } = req.params;

      if (!id) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Lesson ID is required',
          400
        );
      }

      const progress = await lessonService.completeLessonService(
        req.user.id,
        id
      );

      res.status(200).json({
        success: true,
        data: {
          message: 'Lesson completed',
          progress,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async submitQuiz(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const { id } = req.params;
      const { answers } = req.body;

      if (!id) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Lesson ID is required',
          400
        );
      }

      if (!answers || typeof answers !== 'object') {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Answers object is required',
          400
        );
      }

      const result = await lessonService.submitQuiz(
        req.user.id,
        id,
        answers
      );

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingLessons(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ERROR_CODES.AUTH_MISSING_TOKEN,
          'Missing authentication token',
          401
        );
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const lessons = await lessonService.getUpcomingLessons(
        req.user.id,
        limit
      );

      res.status(200).json({
        success: true,
        data: lessons,
        pagination: {
          limit,
          total: lessons.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const lessonController = new LessonController();
