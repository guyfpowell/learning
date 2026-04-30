import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import lessonRoutes from './routes/lessons';
import subscriptionRoutes from './routes/subscriptions';
import notificationRoutes from './routes/notifications';
import coachingRoutes from './routes/coaching';
import adminRoutes from './routes/admin';
import teamRoutes from './routes/teams';
import { startDailyReminderJob } from './jobs/dailyReminderJob';
import { startStreakAtRiskJob } from './jobs/streakAtRiskJob';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Learning App API v0.1.0' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Lesson routes
app.use('/api/lessons', lessonRoutes);

// Subscription routes
app.use('/api/subscriptions', subscriptionRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// AI Coaching routes (Pro/Premium tier only)
app.use('/api/coaching', coachingRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Team routes
app.use('/api/teams', teamRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User routes: http://localhost:${PORT}/api/users`);
  console.log(`📚 Lesson routes: http://localhost:${PORT}/api/lessons`);
  console.log(`💳 Subscription routes: http://localhost:${PORT}/api/subscriptions`);
  console.log(`🔔 Notification routes: http://localhost:${PORT}/api/notifications`);

  // Start background jobs
  startDailyReminderJob();
  startStreakAtRiskJob();
  console.log(`⏰ Background jobs started (daily reminder + streak-at-risk)`);
});

export default app;
