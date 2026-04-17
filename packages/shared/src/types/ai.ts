import { z } from 'zod';

export const QuizOutputSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correct_answer: z.string().min(1),
  explanation: z.string().min(1),
});

export const LessonOutputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  estimated_minutes: z.number().int().positive(),
  key_takeaways: z.array(z.string()).min(1),
  quiz: QuizOutputSchema,
});

export const CoachingOutputSchema = z.object({
  message: z.string().min(1),
  suggestions: z.array(z.string()).default([]),
});

export type LessonOutput = z.infer<typeof LessonOutputSchema>;
export type QuizOutput = z.infer<typeof QuizOutputSchema>;
export type CoachingOutput = z.infer<typeof CoachingOutputSchema>;

// Request types sent to the Python AI service
export interface LessonRequest {
  skill_id: string;
  skill_level: string;
  topic: string;
  user_context: {
    goal?: string;
    learningStyle?: string;
    completedLessons?: number;
  };
  tier: string;
}

export interface CoachingRequest {
  messages: Array<{ role: 'user' | 'assistant' | string; content: string }>;
  lesson_context: string;
  user_context: Record<string, string>;
  tier: string;
}
