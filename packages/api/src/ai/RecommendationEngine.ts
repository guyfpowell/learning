import { prisma } from '../db';

export class RecommendationEngine {
  private static COLD_START_THRESHOLD = 3; // serve lessons in order for first N lessons

  async getNextLesson(userId: string, skillPathId: string): Promise<string | null> {
    // Fetch all progress for this skill path
    const progress = await prisma.userProgress.findMany({
      where: { userId, lesson: { skillPathId } },
      include: { lesson: true },
      orderBy: { lesson: { day: 'asc' } },
    });

    const completed = progress.filter((p) => p.completedAt);
    const incomplete = progress.filter((p) => !p.completedAt);

    // Cold-start: fewer than threshold completed → serve next by day order
    if (completed.length < RecommendationEngine.COLD_START_THRESHOLD) {
      return incomplete[0]?.lessonId ?? null;
    }

    // UCB1: score each incomplete lesson based on past engagement
    const totalPulls = completed.length;
    let bestLessonId: string | null = null;
    let bestScore = -Infinity;

    for (const p of incomplete) {
      const pulls = p.revisitCount + 1; // +1 to avoid division by zero
      const reward = this._computeReward(p.quizScore, p.completionTime);
      const exploration = Math.sqrt((2 * Math.log(totalPulls)) / pulls);
      const ucbScore = reward + exploration;

      if (ucbScore > bestScore) {
        bestScore = ucbScore;
        bestLessonId = p.lessonId;
      }
    }

    return bestLessonId;
  }

  async recordOutcome(
    userId: string,
    lessonId: string,
    quizScore: number,
    completionTime: number
  ): Promise<void> {
    await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, quizScore, completionTime, completedAt: new Date() },
      update: { quizScore, completionTime },
    });
  }

  private _computeReward(quizScore: number | null, completionTime: number | null): number {
    // Normalise quiz score 0–100 → 0–1 (default 0.5 if no data)
    const normScore = quizScore != null ? quizScore / 100 : 0.5;
    // Completion time signal: not used in reward for now (just quiz score)
    void completionTime;
    return normScore;
  }
}

export const recommendationEngine = new RecommendationEngine();
