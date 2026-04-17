import { prisma } from '../db';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

const K_FACTOR = 32; // Elo K-factor — controls rating volatility

function expectedScore(rating: number): number {
  // Expected score against a "par" of 1000
  return 1 / (1 + Math.pow(10, (1000 - rating) / 400));
}

function ratingToLevel(rating: number): SkillLevel {
  if (rating < 800) return 'beginner';
  if (rating <= 1200) return 'intermediate';
  return 'advanced';
}

export class SkillTracker {
  async getCurrentLevel(userId: string, skillId: string): Promise<SkillLevel> {
    const record = await prisma.userSkillRating.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });
    return ratingToLevel(record?.rating ?? 1000);
  }

  async updateRating(userId: string, skillId: string, quizScore: number): Promise<void> {
    const record = await prisma.userSkillRating.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });
    const currentRating = record?.rating ?? 1000;

    // Normalise quiz score (0–100) to Elo actual score (0–1)
    const actualScore = quizScore / 100;
    const expected = expectedScore(currentRating);
    const newRating = Math.round(currentRating + K_FACTOR * (actualScore - expected));

    await prisma.userSkillRating.upsert({
      where: { userId_skillId: { userId, skillId } },
      create: { userId, skillId, rating: newRating },
      update: { rating: newRating },
    });
  }

  getRatingToLevel(rating: number): SkillLevel {
    return ratingToLevel(rating);
  }
}

export const skillTracker = new SkillTracker();
