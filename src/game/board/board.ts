export const BOARD_SIZE = 9;
export const WIN_LENGTH = 5;

export type Cell = 0 | 1 | 2;
export type Player = 1 | 2;
export type Position = { row: number; col: number };
export type Board = Cell[][];

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

export function createBoard(size = BOARD_SIZE): Board {
  return Array.from({ length: size }, () => Array<Cell>(size).fill(0));
}

export function isInsideBoard(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < board[row].length;
}

function countDirection(board: Board, origin: Position, player: Player, dr: number, dc: number): number {
  let count = 0;
  for (
    let row = origin.row + dr, col = origin.col + dc;
    isInsideBoard(board, row, col) && board[row][col] === player;
    row += dr, col += dc
  ) {
    count += 1;
  }
  return count;
}

export function longestLine(board: Board, origin: Position, player: Player): number {
  return Math.max(
    ...DIRECTIONS.map(
      ([dr, dc]) =>
        1 +
        countDirection(board, origin, player, dr, dc) +
        countDirection(board, origin, player, -dr, -dc),
    ),
  );
}

export function isWinningMove(board: Board, origin: Position, player: Player): boolean {
  return longestLine(board, origin, player) >= WIN_LENGTH;
}

export function winningLine(board: Board, origin: Position, player: Player): Position[] {
  for (const [dr, dc] of DIRECTIONS) {
    let row = origin.row;
    let col = origin.col;

    while (isInsideBoard(board, row - dr, col - dc) && board[row - dr][col - dc] === player) {
      row -= dr;
      col -= dc;
    }

    const line: Position[] = [];
    while (isInsideBoard(board, row, col) && board[row][col] === player) {
      line.push({ row, col });
      row += dr;
      col += dc;
    }

    if (line.length >= WIN_LENGTH) return line;
  }

  return [];
}

export function emptyCells(board: Board): Position[] {
  const positions: Position[] = [];
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === 0) positions.push({ row: rowIndex, col: colIndex });
    });
  });
  return positions;
}
