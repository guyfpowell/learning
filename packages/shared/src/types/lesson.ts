export interface Lesson {
  id: string;
  skillPathId: string;
  day: number;
  title: string;
  content: string;
  durationMinutes: number;
  mediaUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  quizzes: Quiz[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonContent {
  title: string;
  introduction: string;
  keyPoints: string[];
  example: string;
  summary: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'product-management' | 'ai-engineering' | 'business';
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillPath {
  id: string;
  skillId: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  durationHours: number;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  lessonId: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizFeedback {
  quizId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResult {
  score: number;
  feedbacks: QuizFeedback[];
  lesson: Lesson;
  coaching: string | null; // AI coaching feedback for Pro/Premium users; null for free/starter or when unavailable
  streak: number;          // Current streak count after this quiz
  milestone: string | null; // Milestone label if streak hit one (e.g. "7-day streak"); null otherwise
}
