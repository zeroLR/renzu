import { describe, expect, it } from 'vitest';
import { createBoard } from '../src/game/board/board';
import { evaluatePlacementPattern } from '../src/game/rules/placement-pattern';
import {
  advancePatternMastery,
  patternMasteryGain,
  spendPatternMastery,
} from '../src/heroes/economies/pattern-mastery';

describe('pattern mastery grammar', () => {
  it('lets a hero count only the pattern events named by its rule', () => {
    const board = createBoard();
    board[4][2] = 1;
    board[4][3] = 1;
    board[4][4] = 1;
    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(patternMasteryGain(outcome, { eventKinds: ['open-three'], threshold: 2 })).toBe(1);
    expect(patternMasteryGain(outcome, { eventKinds: ['closed-four'], threshold: 2 })).toBe(0);
  });

  it('accumulates to a bounded threshold without granting an extra turn', () => {
    const board = createBoard();
    board[4][2] = 1;
    board[4][3] = 1;
    board[4][4] = 1;
    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);
    const rule = { eventKinds: ['open-three'] as const, threshold: 2 };

    const first = advancePatternMastery(0, outcome, rule);
    const second = advancePatternMastery(first.value, outcome, rule);
    const capped = advancePatternMastery(second.value, outcome, rule);

    expect(first).toEqual({ value: 1, threshold: 2, ready: false });
    expect(second).toEqual({ value: 2, threshold: 2, ready: true });
    expect(capped).toEqual({ value: 2, threshold: 2, ready: true });
  });

  it('resets a ready mastery entitlement when it is spent', () => {
    expect(spendPatternMastery({ value: 2, threshold: 2, ready: true })).toEqual({
      value: 0,
      threshold: 2,
      ready: false,
    });
  });

  it('does not generate mastery from the winning placement', () => {
    const board = createBoard();
    for (let col = 0; col < 5; col += 1) board[4][col] = 1;
    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(patternMasteryGain(outcome, { eventKinds: ['closed-four', 'open-four'], threshold: 1 })).toBe(0);
  });
});
