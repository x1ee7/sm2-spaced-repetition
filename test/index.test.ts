import { describe, it, expect, vi, afterEach } from "vitest";
import { sm2, answerToQuality } from "../src/index.js";

describe("sm2 — deterministic reference values", () => {
  it("first correct review: interval 1, reps 1, ease unchanged at q=4", () => {
    const out = sm2({ quality: 4, repetitions: 0, easeFactor: 2.5, interval: 0 });
    expect(out.interval).toBe(1);
    expect(out.repetitions).toBe(1);
    expect(out.easeFactor).toBeCloseTo(2.5, 10);
  });

  it("second correct review: interval jumps to 6", () => {
    const out = sm2({ quality: 4, repetitions: 1, easeFactor: 2.5, interval: 1 });
    expect(out.interval).toBe(6);
    expect(out.repetitions).toBe(2);
  });

  it("third review: interval = round(interval * ease), ease rises at q=5", () => {
    const out = sm2({ quality: 5, repetitions: 2, easeFactor: 2.5, interval: 6 });
    expect(out.interval).toBe(15); // round(6 * 2.5)
    expect(out.repetitions).toBe(3);
    expect(out.easeFactor).toBeCloseTo(2.6, 10);
  });

  it("lapse (q<3) resets reps + interval and drops ease", () => {
    const out = sm2({ quality: 1, repetitions: 5, easeFactor: 2.5, interval: 20 });
    expect(out.repetitions).toBe(0);
    expect(out.interval).toBe(1);
    expect(out.easeFactor).toBeCloseTo(1.96, 10); // 2.5 - 0.54
  });

  it("ease factor never falls below the 1.3 floor", () => {
    const out = sm2({ quality: 0, repetitions: 0, easeFactor: 1.3, interval: 1 });
    expect(out.easeFactor).toBe(1.3);
  });
});

describe("sm2 — next review date", () => {
  afterEach(() => vi.useRealTimers());

  it("schedules `interval` days out, normalized to start of day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T14:37:00"));
    const out = sm2({ quality: 4, repetitions: 1, easeFactor: 2.5, interval: 1 }); // interval -> 6
    const d = out.nextReviewDate;
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getDate()).toBe(24); // 18 + 6
  });
});

describe("answerToQuality", () => {
  it("negative time = skipped/blackout (0)", () => {
    expect(answerToQuality(true, -1, 1)).toBe(0);
  });
  it("incorrect = 1", () => {
    expect(answerToQuality(false, 5, 1)).toBe(1);
  });
  it("fast + easy/medium correct = perfect (5)", () => {
    expect(answerToQuality(true, 10, 1)).toBe(5);
    expect(answerToQuality(true, 14, 2)).toBe(5);
  });
  it("fast + hard correct = good (4)", () => {
    expect(answerToQuality(true, 10, 3)).toBe(4);
  });
  it("reasonable time, not hard = good (4)", () => {
    expect(answerToQuality(true, 30, 2)).toBe(4);
  });
  it("slow correct = barely (3)", () => {
    expect(answerToQuality(true, 90, 1)).toBe(3);
    expect(answerToQuality(true, 90, 3)).toBe(3);
  });
});
