import { classifyLearningStyle } from '../LearningStyleClassifier';

describe('classifyLearningStyle', () => {
  it('returns reinforcement when avgRevisitCount >= 2', () => {
    expect(
      classifyLearningStyle({ avgCompletionRatio: 1.0, avgFirstAttemptAccuracy: 0.8, avgRevisitCount: 2 })
    ).toBe('reinforcement');
  });

  it('returns visual-concise when fast reader with high accuracy', () => {
    expect(
      classifyLearningStyle({ avgCompletionRatio: 0.7, avgFirstAttemptAccuracy: 0.85, avgRevisitCount: 0 })
    ).toBe('visual-concise');
  });

  it('returns detailed-narrative when slow reader', () => {
    expect(
      classifyLearningStyle({ avgCompletionRatio: 1.5, avgFirstAttemptAccuracy: 0.7, avgRevisitCount: 0 })
    ).toBe('detailed-narrative');
  });

  it('returns detailed-narrative when low first-attempt accuracy', () => {
    expect(
      classifyLearningStyle({ avgCompletionRatio: 1.0, avgFirstAttemptAccuracy: 0.4, avgRevisitCount: 0 })
    ).toBe('detailed-narrative');
  });

  it('returns general when no strong signal', () => {
    expect(
      classifyLearningStyle({ avgCompletionRatio: 1.0, avgFirstAttemptAccuracy: 0.65, avgRevisitCount: 1 })
    ).toBe('general');
  });

  it('reinforcement takes priority over fast-reader signal', () => {
    // High revisit wins even if also fast + accurate
    expect(
      classifyLearningStyle({ avgCompletionRatio: 0.6, avgFirstAttemptAccuracy: 0.95, avgRevisitCount: 3 })
    ).toBe('reinforcement');
  });
});
