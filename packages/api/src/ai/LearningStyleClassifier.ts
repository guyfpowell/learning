export type LearningStyle = 'visual-concise' | 'detailed-narrative' | 'reinforcement' | 'general';

export interface EngagementSignals {
  avgCompletionRatio: number; // actual / estimated completion time (< 1 = fast, > 1 = slow)
  avgFirstAttemptAccuracy: number; // avg quiz score 0–1 on first attempt
  avgRevisitCount: number; // average number of lesson revisits
}

export function classifyLearningStyle(signals: EngagementSignals): LearningStyle {
  const { avgCompletionRatio, avgFirstAttemptAccuracy, avgRevisitCount } = signals;

  // High revisit rate → reinforcement-focused learner
  if (avgRevisitCount >= 2) {
    return 'reinforcement';
  }

  // Fast reader + high accuracy → concise format
  if (avgCompletionRatio <= 0.8 && avgFirstAttemptAccuracy >= 0.75) {
    return 'visual-concise';
  }

  // Slow reader or low accuracy → detailed narrative
  if (avgCompletionRatio >= 1.2 || avgFirstAttemptAccuracy < 0.5) {
    return 'detailed-narrative';
  }

  return 'general';
}

export class LearningStyleClassifier {
  classify(signals: EngagementSignals): LearningStyle {
    return classifyLearningStyle(signals);
  }
}

export const learningStyleClassifier = new LearningStyleClassifier();
