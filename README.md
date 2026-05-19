# @x1ee7/sm2-spaced-repetition

[![CI](https://github.com/x1ee7/sm2-spaced-repetition/actions/workflows/ci.yml/badge.svg)](https://github.com/x1ee7/sm2-spaced-repetition/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4- db61a2)](https://github.com/sponsors/x1ee7)

**Zero-dependency SM-2 spaced-repetition algorithm in TypeScript**, plus a
practical quiz-answer → quality mapping. SM-2 is the scheduling algorithm
behind SuperMemo and Anki: given how well you recalled a flashcard, it decides
the next review interval and the date you should see the card again.

This package is just the math — **you bring your own storage**. No database,
no React, no opinions about where your cards live.

Extracted from the production codebase of **[examace.ca](https://examace.ca)** —
a Canadian real-estate exam prep platform — where it schedules thousands of
review questions a day. The persistence layer stays in the app; the algorithm
is open.

## Install

```sh
npm install @x1ee7/sm2-spaced-repetition
```

```sh
pnpm add @x1ee7/sm2-spaced-repetition
# or: yarn add @x1ee7/sm2-spaced-repetition
```

ESM + CommonJS + TypeScript types. No dependencies.

## Usage

```ts
import { sm2, answerToQuality } from "@x1ee7/sm2-spaced-repetition";

// You stored these on the card from its last review:
const card = { repetitions: 1, easeFactor: 2.5, interval: 1 };

// User just answered: correct, took 8 seconds, on a medium question.
const quality = answerToQuality(true, 8, 2); // → 5 (perfect recall)

const next = sm2({ quality, ...card });
// next = {
//   repetitions: 2,
//   easeFactor: 2.6,
//   interval: 6,                 // show again in 6 days
//   nextReviewDate: <Date>,      // today + 6 days, at 00:00 local
// }

// Persist next.repetitions / easeFactor / interval / nextReviewDate
// back onto the card however you like.
```

A wrong answer (`quality < 3`) resets `repetitions` and `interval` so the
card starts over; the ease factor still adjusts and never drops below `1.3`.

## How the SM-2 algorithm works

SM-2 tracks three numbers per card and updates them on every review:

- **`repetitions`** — how many times in a row the card was recalled
  correctly. Reset to 0 on a lapse.
- **`easeFactor`** — how "easy" the card is (starts at 2.5). It grows on good
  recall and shrinks on poor recall, with a hard floor of **1.3** so a
  difficult card never collapses to near-zero intervals.
- **`interval`** — days until the next review.

On a correct answer (`quality >= 3`):

1. `repetitions = 0` → `interval = 1` day
2. `repetitions = 1` → `interval = 6` days
3. otherwise → `interval = round(previous interval × easeFactor)`

The ease factor is then nudged by the standard SM-2 formula
(`EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))`), clamped at `1.3`. On a
lapse the card re-enters the short-interval queue but keeps a (reduced) ease
factor, so genuinely hard cards are shown more often without resetting all
prior signal.

## API

| Export | Description |
| --- | --- |
| `sm2(input)` | Core SM-2 step. `input`: `{ quality (0–5), repetitions, easeFactor, interval }` → `{ repetitions, easeFactor, interval, nextReviewDate }`. |
| `answerToQuality(isCorrect, timeSpentSeconds, difficulty)` | Maps a quiz outcome to an SM-2 quality score (0–5) using speed and question difficulty (1=easy, 2=medium, 3=hard). Negative time = skipped (0). |
| `SM2Input` / `SM2Output` | TypeScript types. |

### Notes

- `nextReviewDate` is computed from `new Date()` and normalized to local
  start-of-day (`00:00`) to avoid time-of-day drift across reviews — exactly
  as it runs in production. Use fake timers in tests if you need determinism.
- `answerToQuality` is one reasonable mapping (the one examace.ca uses); the
  thresholds are intentionally simple. Swap in your own and feed `sm2()`
  directly if you prefer.

Reference: [SuperMemo — SM-2](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-of-learning).

## FAQ

### What is the SM-2 algorithm?

SM-2 is the spaced-repetition scheduling algorithm from SuperMemo (1987),
also the basis of Anki's default scheduler. It increases the gap between
reviews each time you recall a card correctly and shrinks it when you forget.

### How is SM-2 different from the Leitner system?

Leitner moves a card between a small number of fixed boxes. SM-2 keeps a
continuous per-card ease factor and computes an exact interval, so it adapts
more finely to how hard each individual card is for you.

### How is SM-2 different from FSRS / Anki's newer scheduler?

FSRS models memory with a probabilistic forgetting curve and many parameters.
SM-2 is far simpler — three numbers and a closed-form update — which makes it
easy to audit, embed, and run with no training data. This package implements
classic SM-2.

### Why does the ease factor never go below 1.3?

A floor of 1.3 prevents a string of bad reviews from driving the interval so
low the card is shown almost every session forever. It is part of the
original SM-2 specification.

### Do I need a database to use this?

No. The package only computes the next schedule from the numbers you pass in.
Where you store `repetitions`, `easeFactor`, `interval`, and `nextReviewDate`
is entirely up to you.

## Sponsor

Maintained in the open by the team behind [examace.ca](https://examace.ca).
If it saved you from re-deriving the ease-factor formula, consider
**[sponsoring on GitHub](https://github.com/sponsors/x1ee7)**.

## License

MIT © [examace.ca](https://examace.ca)
