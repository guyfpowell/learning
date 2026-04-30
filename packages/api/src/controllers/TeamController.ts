import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { teamService } from '../services/TeamService';
import { AppError } from '../middleware/error-handler';

export class TeamController {
  async createTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, slug } = req.body;
      if (!name) return next(new AppError('VALIDATION_ERROR', 'Team name is required', 400));

      const team = await teamService.createTeam(req.user!.id, { name, slug });
      res.status(201).json({ success: true, data: team });
    } catch (err) {
      next(err);
    }
  }

  async getTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const team = await teamService.getTeam(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: team });
    } catch (err) {
      next(err);
    }
  }

  async inviteMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) return next(new AppError('VALIDATION_ERROR', 'Email is required', 400));

      const result = await teamService.inviteMember(req.params.id, req.user!.id, email);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async acceptInvite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) return next(new AppError('VALIDATION_ERROR', 'Invite token is required', 400));

      const membership = await teamService.acceptInvite(token, req.user!.id);
      res.status(200).json({ success: true, data: membership });
    } catch (err) {
      next(err);
    }
  }

  async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await teamService.removeMember(req.params.id, req.user!.id, req.params.userId);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async getTeamSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const subscription = await teamService.getTeamSubscription(req.params.id);
      res.status(200).json({ success: true, data: subscription });
    } catch (err) {
      next(err);
    }
  }
}

export const teamController = new TeamController();
