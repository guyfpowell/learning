import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { adminService } from '../services/AdminService';
import { AppError } from '../middleware/error-handler';

export class AdminController {
  async listSkills(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const skills = await adminService.listSkills();
      res.status(200).json({ success: true, data: skills });
    } catch (error) {
      next(error);
    }
  }

  async createSkill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, category } = req.body;
      if (!name || !description || !category) {
        throw new AppError('VALIDATION_ERROR', 'name, description, and category are required', 400);
      }
      const skill = await adminService.createSkill({ name, description, category });
      res.status(201).json({ success: true, data: skill });
    } catch (error) {
      next(error);
    }
  }

  async listSkillPaths(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const skillId = req.query.skillId as string | undefined;
      const paths = await adminService.listSkillPaths(skillId);
      res.status(200).json({ success: true, data: paths });
    } catch (error) {
      next(error);
    }
  }

  async createSkillPath(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skillId, level, durationHours } = req.body;
      if (!skillId || !level || durationHours === undefined) {
        throw new AppError('VALIDATION_ERROR', 'skillId, level, and durationHours are required', 400);
      }
      const path = await adminService.createSkillPath({ skillId, level, durationHours: Number(durationHours) });
      res.status(201).json({ success: true, data: path });
    } catch (error) {
      next(error);
    }
  }

  async listLessons(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const skill = req.query.skill as string | undefined;
      const level = req.query.level as string | undefined;
      const skillPathId = req.query.skillPathId as string | undefined;
      const result = await adminService.listLessons({ page, skill, level, skillPathId });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createLesson(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skillPathId, day, title, content, durationMinutes, difficulty, mediaUrl } = req.body;
      if (!skillPathId || !day || !title || !content || !durationMinutes || !difficulty) {
        throw new AppError('VALIDATION_ERROR', 'skillPathId, day, title, content, durationMinutes, and difficulty are required', 400);
      }
      const lesson = await adminService.createLesson({
        skillPathId, day: Number(day), title, content,
        durationMinutes: Number(durationMinutes), difficulty, mediaUrl,
      });
      res.status(201).json({ success: true, data: lesson });
    } catch (error) {
      next(error);
    }
  }

  async updateLesson(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const lesson = await adminService.updateLesson(id, req.body);
      res.status(200).json({ success: true, data: lesson });
    } catch (error) {
      next(error);
    }
  }

  async deleteLesson(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const lesson = await adminService.deleteLesson(id);
      res.status(200).json({ success: true, data: lesson });
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const result = await adminService.listUsers({ page });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
