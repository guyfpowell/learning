import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authMiddleware } from '../middleware/auth';
import { adminGuard } from '../middleware/adminGuard';

const router = Router();

router.use(authMiddleware);
router.use(adminGuard);

router.get('/skills', (req, res, next) => adminController.listSkills(req, res, next));
router.post('/skills', (req, res, next) => adminController.createSkill(req, res, next));

router.get('/skill-paths', (req, res, next) => adminController.listSkillPaths(req, res, next));
router.post('/skill-paths', (req, res, next) => adminController.createSkillPath(req, res, next));

router.get('/lessons', (req, res, next) => adminController.listLessons(req, res, next));
router.post('/lessons', (req, res, next) => adminController.createLesson(req, res, next));
router.patch('/lessons/:id', (req, res, next) => adminController.updateLesson(req, res, next));
router.delete('/lessons/:id', (req, res, next) => adminController.deleteLesson(req, res, next));

router.get('/users', (req, res, next) => adminController.listUsers(req, res, next));

router.get('/stats', (req, res, next) => adminController.getStats(req, res, next));

export default router;
