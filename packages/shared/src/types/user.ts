export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  goal?: string;
  preferredTime?: string; // 'morning' | 'afternoon' | 'evening'
  timezone?: string;
  learningStyle?: string; // 'visual' | 'text' | 'mixed'
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completedAt?: Date;
  quizScore?: number;
  streakCount: number;
  lastLessonDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAuth {
  id: string;
  email: string;
  name: string;
  profileId?: string;
}

export interface UserProgressStats {
  totalLessonsCompleted: number;
  currentStreak: number;
  averageScore: number;
  lastLessonDate: Date | null;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  enableDailyReminder: boolean;
  reminderTime?: 'morning' | 'afternoon' | 'evening';
  enableStreak: boolean;
  enableLessonAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}
