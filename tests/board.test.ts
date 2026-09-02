import { describe, expect, it } from 'vitest';
import { createBoard, emptyCells, isWinningMove, winningLine } from '../src/game/board/board';

describe('board rules', () => {
  it('creates an empty 9x9 board', () => {
    const board = createBoard();
    expect(board).toHaveLength(9);
    expect(board.every((row) => row.length === 9 && row.every((cell) => cell === 0))).toBe(true);
  });

  it('detects a five-stone winning line', () => {
    const board = createBoard();
    for (let col = 1; col <= 5; col += 1) board[4][col] = 1;

    expect(isWinningMove(board, { row: 4, col: 3 }, 1)).toBe(true);
    expect(winningLine(board, { row: 4, col: 3 }, 1)).toEqual([
      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },
    ]);
  });

  it('returns only empty positions', () => {
    const board = createBoard();
    board[0][0] = 1;
    board[8][8] = 2;

    const cells = emptyCells(board);
    expect(cells).toHaveLength(79);
    expect(cells).not.toContainEqual({ row: 0, col: 0 });
    expect(cells).not.toContainEqual({ row: 8, col: 8 });
  });
});
