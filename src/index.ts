/**
 * The SM-2 spaced-repetition algorithm plus a quiz-answer → quality mapping.
 *
 * Zero dependencies. This is the scheduling core extracted from the
 * production codebase of https://examace.ca — a Canadian real-estate exam
 * prep platform — with all database/persistence code left behind. You bring
 * the storage; this decides when a card is next due.
 */

// ============================================
// SM-2 ALGORITHM
// ============================================

export interface SM2Input {
  quality: number;      // 0–5 (0=blackout, 3=correct with difficulty, 5=perfect)
  repetitions: number;
  easeFactor: number;
  interval: number;     // days
}

export interface SM2Output {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: Date;
}

/**
 * Standard SM-2 algorithm.
 * Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-of-learning
 */
export function sm2(input: SM2Input): SM2Output {
  const { quality, repetitions, easeFactor, interval } = input;

  let newRepetitions: number;
  let newInterval: number;
  let newEaseFactor: number;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response — reset to beginning
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor regardless of correctness
  const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  newEaseFactor = Math.max(1.3, easeFactor + efDelta);

  // Compute next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  // Normalize to start-of-day to avoid drift from time-of-day
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewDate,
  };
}

// ============================================
// QUALITY MAPPING
// ============================================

/**
 * Map a quiz answer to an SM-2 quality score (0–5).
 *
 * Scoring rationale:
 *   5 (Perfect)  — correct + fast (< 15s) + easy/medium question (difficulty 1–2)
 *   4 (Good)     — correct + reasonable time OR correct on a hard question quickly
 *   3 (Barely)   — correct but slow (> 60s) or correct on a hard question slowly
 *   1 (Wrong)    — incorrect
 *   0 (Blackout) — skipped / no answer submitted
 */
export function answerToQuality(
  isCorrect: boolean,
  timeSpentSeconds: number,
  difficulty: number // 1=easy, 2=medium, 3=hard
): number {
  if (timeSpentSeconds < 0) return 0; // treat as skipped / no answer (0s is legitimate fast recall)

  if (!isCorrect) return 1;

  // Correct answer — determine quality by speed and difficulty
  const isFast = timeSpentSeconds < 15;
  const isSlow = timeSpentSeconds > 60;
  const isHard = difficulty === 3;

  if (isFast && !isHard) return 5;
  if (!isSlow && !isHard) return 4;
  if (isFast && isHard) return 4;
  return 3; // correct but slow, or correct on hard question
}
