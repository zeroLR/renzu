import { isInsideBoard, type Board, type Player, type Position } from '../board/board';

export type PatternDirection = 'vertical' | 'horizontal' | 'diagonal-down' | 'diagonal-up';

export interface PlacementPatternLine {
  direction: PatternDirection;
  length: 3 | 4;
  reward: 1 | 2;
}

export interface PlacementPatternOutcome {
  actor: Player;
  at: Position;
  lines: readonly PlacementPatternLine[];
  reward: number;
  winning: boolean;
  adjacentFriendlyCount: number;
  adjacentEnemy: boolean;
}

const directions = [
  { direction: 'vertical', dr: 1, dc: 0 },
  { direction: 'horizontal', dr: 0, dc: 1 },
  { direction: 'diagonal-down', dr: 1, dc: 1 },
  { direction: 'diagonal-up', dr: 1, dc: -1 },
] as const;

function countDirection(board: Board, at: Position, actor: Player, dr: number, dc: number): number {
  let total = 0;
  for (
    let row = at.row + dr, col = at.col + dc;
    isInsideBoard(board, row, col) && board[row][col] === actor;
    row += dr, col += dc
  ) {
    total += 1;
  }
  return total;
}

export function evaluatePlacementPattern(board: Board, at: Position, actor: Player): PlacementPatternOutcome {
  if (board[at.row]?.[at.col] !== actor) {
    return {
      actor,
      at,
      lines: [],
      reward: 0,
      winning: false,
      adjacentFriendlyCount: 0,
      adjacentEnemy: false,
    };
  }

  const lines: PlacementPatternLine[] = [];
  let winning = false;

  for (const { direction, dr, dc } of directions) {
    const length = 1
      + countDirection(board, at, actor, dr, dc)
      + countDirection(board, at, actor, -dr, -dc);
    if (length >= 5) winning = true;
    else if (length === 4) lines.push({ direction, length: 4, reward: 2 });
    else if (length === 3) lines.push({ direction, length: 3, reward: 1 });
  }

  const enemy: Player = actor === 1 ? 2 : 1;
  let adjacentFriendlyCount = 0;
  let adjacentEnemy = false;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const cell = board[at.row + dr]?.[at.col + dc];
      if (cell === actor) adjacentFriendlyCount += 1;
      if (cell === enemy) adjacentEnemy = true;
    }
  }

  const rewardedLines = winning ? [] : lines;
  return {
    actor,
    at,
    lines: rewardedLines,
    reward: rewardedLines.reduce((sum, line) => sum + line.reward, 0),
    winning,
    adjacentFriendlyCount,
    adjacentEnemy,
  };
}
