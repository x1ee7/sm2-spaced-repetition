# @x1ee7/sm2-spaced-repetition

[![CI](https://github.com/x1ee7/sm2-spaced-repetition/actions/workflows/ci.yml/badge.svg)](https://github.com/x1ee7/sm2-spaced-repetition/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4- db61a2)](https://github.com/sponsors/x1ee7)

**Zero-dependency** SM-2 spaced-repetition algorithm, plus a practical
quiz-answer → quality mapping.

SM-2 is the scheduler behind SuperMemo and Anki: given how well you recalled
a card, it decides when you should see it next. This package is just the
math — **you bring your own storage**. No database, no React, no opinions
about where your cards live.

Extracted from the production codebase of **[examace.ca](https://examace.ca)** —
a Canadian real-estate exam prep platform — where it schedules thousands of
review questions a day. The persistence layer stays in the app; the algorithm
is open.

## Install

```sh
npm install @x1ee7/sm2-spaced-repetition
```

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

A wrong answer (`quality < 3`) resets `repetitions` and `interval` to start
the card over; the ease factor still adjusts and never drops below `1.3`.

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

## Sponsor

Maintained in the open by the team behind [examace.ca](https://examace.ca).
If it saved you from re-deriving the ease-factor formula, consider
**[sponsoring on GitHub](https://github.com/sponsors/x1ee7)**.

## License

MIT © [examace.ca](https://examace.ca)
