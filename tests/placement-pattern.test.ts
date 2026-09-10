import { describe, expect, it } from 'vitest';
import { createBoard } from '../src/game/board/board';
import { createBoardEffect } from '../src/game/combat/board-effects';
import { evaluatePlacementPattern } from '../src/game/rules/placement-pattern';

describe('placement pattern evaluation', () => {
  it('rewards and classifies an open three through the newly placed stone', () => {
    const board = createBoard();
    board[4][2] = 1;
    board[4][3] = 1;
    board[4][4] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.reward).toBe(1);
    expect(outcome.lines).toContainEqual({ direction: 'horizontal', length: 3, reward: 1, openEnds: 2 });
    expect(outcome.events).toContainEqual({ kind: 'open-three', direction: 'horizontal', openEnds: 2 });
    expect(outcome.winning).toBe(false);
  });

  it('classifies a boundary four as closed-four', () => {
    const board = createBoard();
    for (let col = 0; col < 4; col += 1) board[4][col] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 3 }, 1);

    expect(outcome.reward).toBe(2);
    expect(outcome.lines).toContainEqual({ direction: 'horizontal', length: 4, reward: 2, openEnds: 1 });
    expect(outcome.events).toContainEqual({ kind: 'closed-four', direction: 'horizontal', openEnds: 1 });
  });

  it('treats a temporarily blocked endpoint as closed rather than open', () => {
    const board = createBoard();
    board[4][3] = 1;
    board[4][4] = 1;
    board[4][5] = 1;
    const effects = [createBoardEffect('seal', { row: 4, col: 6 }, 2, { kind: 'opponent-turns', remaining: 1 })];

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1, effects);

    expect(outcome.lines).toContainEqual({ direction: 'horizontal', length: 3, reward: 1, openEnds: 1 });
    expect(outcome.events).toContainEqual({ kind: 'closed-three', direction: 'horizontal', openEnds: 1 });
  });

  it('rewards an open four with two points', () => {
    const board = createBoard();
    board[1][1] = 1;
    board[2][2] = 1;
    board[3][3] = 1;
    board[4][4] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.reward).toBe(2);
    expect(outcome.lines).toContainEqual({ direction: 'diagonal-down', length: 4, reward: 2, openEnds: 2 });
    expect(outcome.events).toContainEqual({ kind: 'open-four', direction: 'diagonal-down', openEnds: 2 });
  });

  it('emits multi-threat when multiple qualifying directions are created together', () => {
    const board = createBoard();
    board[4][3] = 1;
    board[4][4] = 1;
    board[4][5] = 1;
    board[3][4] = 1;
    board[5][4] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.reward).toBe(2);
    expect(outcome.lines).toHaveLength(2);
    expect(outcome.events).toContainEqual({ kind: 'multi-threat', count: 2 });
  });

  it('suppresses all pattern reward and mastery events when the placement wins', () => {
    const board = createBoard();
    for (let col = 0; col < 5; col += 1) board[4][col] = 1;
    board[2][4] = 1;
    board[3][4] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.winning).toBe(true);
    expect(outcome.reward).toBe(0);
    expect(outcome.lines).toHaveLength(0);
    expect(outcome.events).toHaveLength(0);
  });

  it('captures adjacency once for downstream passives', () => {
    const board = createBoard();
    board[4][4] = 1;
    board[3][3] = 1;
    board[3][4] = 1;
    board[4][5] = 2;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.adjacentFriendlyCount).toBe(2);
    expect(outcome.adjacentEnemy).toBe(true);
  });
});
