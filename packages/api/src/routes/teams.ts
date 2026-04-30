import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { teamController } from '../controllers/TeamController';
import { teamAnalyticsService } from '../services/TeamAnalyticsService';
import { AppError } from '../middleware/error-handler';

const router = Router();

router.post('/', authMiddleware, (req, res, next) => teamController.createTeam(req as any, res, next));
router.get('/:id', authMiddleware, (req, res, next) => teamController.getTeam(req as any, res, next));
router.post('/:id/invite', authMiddleware, (req, res, next) => teamController.inviteMember(req as any, res, next));
router.post('/:id/accept-invite', authMiddleware, (req, res, next) => teamController.acceptInvite(req as any, res, next));
router.delete('/:id/members/:userId', authMiddleware, (req, res, next) => teamController.removeMember(req as any, res, next));
router.get('/:id/subscription', authMiddleware, (req, res, next) => teamController.getTeamSubscription(req as any, res, next));

router.get('/:id/analytics', authMiddleware, async (req, res, next) => {
  try {
    const data = await teamAnalyticsService.getTeamSummary(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/:id/members/progress', authMiddleware, async (req, res, next) => {
  try {
    const data = await teamAnalyticsService.getMemberProgress(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/:id/skill-gaps', authMiddleware, async (req, res, next) => {
  try {
    const data = await teamAnalyticsService.getSkillGapAnalysis(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/:id/leaderboard', authMiddleware, async (req, res, next) => {
  try {
    const data = await teamAnalyticsService.getTeamLeaderboard(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
