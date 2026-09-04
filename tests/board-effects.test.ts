import { describe, expect, it } from 'vitest';
import { advanceBoardEffectsAfterTurn, createBoardEffect } from '../src/game/combat/board-effects';

describe('board effect lifetime', () => {
  it('advances owner-turn effects only when the owner completes a turn', () => {
    const effect = createBoardEffect('guard', { row: 1, col: 1 }, 1, { kind: 'owner-turns', remaining: 2 });

    expect(advanceBoardEffectsAfterTurn([effect], 2)[0]?.expiry).toEqual({ kind: 'owner-turns', remaining: 2 });
    expect(advanceBoardEffectsAfterTurn([effect], 1)[0]?.expiry).toEqual({ kind: 'owner-turns', remaining: 1 });
  });

  it('expires opponent-turn effects after the opponent consumes the final turn', () => {
    const effect = createBoardEffect('seal', { row: 2, col: 2 }, 1, { kind: 'opponent-turns', remaining: 1 });

    expect(advanceBoardEffectsAfterTurn([effect], 1)).toHaveLength(1);
    expect(advanceBoardEffectsAfterTurn([effect], 2)).toHaveLength(0);
  });

  it('keeps match-scoped effects unchanged', () => {
    const effect = createBoardEffect('corruption', { row: 3, col: 3 }, 2, { kind: 'match' });
    expect(advanceBoardEffectsAfterTurn([effect], 1)).toEqual([effect]);
  });
});
