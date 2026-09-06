import { describe, expect, it } from 'vitest';
import { createBoard } from '../src/game/board/board';
import { evaluatePlacementPattern } from '../src/game/rules/placement-pattern';

describe('placement pattern evaluation', () => {
  it('rewards an exact three through the newly placed stone', () => {
    const board = createBoard();
    board[4][2] = 1;
    board[4][3] = 1;
    board[4][4] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.reward).toBe(1);
    expect(outcome.lines).toContainEqual({ direction: 'horizontal', length: 3, reward: 1 });
    expect(outcome.winning).toBe(false);
  });

  it('rewards an exact four with two points', () => {
    const board = createBoard();
    board[1][1] = 1;
    board[2][2] = 1;
    board[3][3] = 1;
    board[4][4] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.reward).toBe(2);
    expect(outcome.lines).toContainEqual({ direction: 'diagonal-down', length: 4, reward: 2 });
  });

  it('accumulates rewards from multiple qualifying directions', () => {
    const board = createBoard();
    board[4][3] = 1;
    board[4][4] = 1;
    board[4][5] = 1;
    board[3][4] = 1;
    board[5][4] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.reward).toBe(2);
    expect(outcome.lines).toHaveLength(2);
  });

  it('suppresses all pattern reward when the placement wins', () => {
    const board = createBoard();
    for (let col = 0; col < 5; col += 1) board[4][col] = 1;
    board[2][4] = 1;
    board[3][4] = 1;

    const outcome = evaluatePlacementPattern(board, { row: 4, col: 4 }, 1);

    expect(outcome.winning).toBe(true);
    expect(outcome.reward).toBe(0);
    expect(outcome.lines).toHaveLength(0);
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
