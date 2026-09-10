import { isInsideBoard, type Board, type Player, type Position } from '../board/board';
import { isBlocked, type BoardEffect } from '../combat/board-effects';

export type PatternDirection = 'vertical' | 'horizontal' | 'diagonal-down' | 'diagonal-up';
export type PatternOpenEnds = 0 | 1 | 2;
export type PlacementPatternEventKind = 'open-three' | 'closed-three' | 'open-four' | 'closed-four' | 'multi-threat';

export interface PlacementPatternLine {
  direction: PatternDirection;
  length: 3 | 4;
  reward: 1 | 2;
  openEnds: PatternOpenEnds;
}

export type PlacementPatternEvent =
  | {
      kind: Exclude<PlacementPatternEventKind, 'multi-threat'>;
      direction: PatternDirection;
      openEnds: 1 | 2;
    }
  | {
      kind: 'multi-threat';
      count: number;
    };

export interface PlacementPatternOutcome {
  actor: Player;
  at: Position;
  lines: readonly PlacementPatternLine[];
  events: readonly PlacementPatternEvent[];
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

function isOpenEnd(
  board: Board,
  effects: readonly BoardEffect[],
  at: Position,
  dr: number,
  dc: number,
  runLength: number,
): boolean {
  const end = {
    row: at.row + dr * (runLength + 1),
    col: at.col + dc * (runLength + 1),
  };
  return isInsideBoard(board, end.row, end.col)
    && board[end.row][end.col] === 0
    && !isBlocked(effects, end);
}

function eventForLine(line: PlacementPatternLine): PlacementPatternEvent | null {
  if (line.openEnds === 0) return null;
  if (line.length === 3) {
    return {
      kind: line.openEnds === 2 ? 'open-three' : 'closed-three',
      direction: line.direction,
      openEnds: line.openEnds,
    };
  }
  return {
    kind: line.openEnds === 2 ? 'open-four' : 'closed-four',
    direction: line.direction,
    openEnds: line.openEnds,
  };
}

export function evaluatePlacementPattern(
  board: Board,
  at: Position,
  actor: Player,
  effects: readonly BoardEffect[] = [],
): PlacementPatternOutcome {
  if (board[at.row]?.[at.col] !== actor) {
    return {
      actor,
      at,
      lines: [],
      events: [],
      reward: 0,
      winning: false,
      adjacentFriendlyCount: 0,
      adjacentEnemy: false,
    };
  }

  const lines: PlacementPatternLine[] = [];
  let winning = false;

  for (const { direction, dr, dc } of directions) {
    const forward = countDirection(board, at, actor, dr, dc);
    const backward = countDirection(board, at, actor, -dr, -dc);
    const length = 1 + forward + backward;
    if (length >= 5) {
      winning = true;
      continue;
    }
    if (length !== 3 && length !== 4) continue;

    const openEnds = (
      Number(isOpenEnd(board, effects, at, dr, dc, forward))
      + Number(isOpenEnd(board, effects, at, -dr, -dc, backward))
    ) as PatternOpenEnds;
    lines.push({ direction, length, reward: length === 3 ? 1 : 2, openEnds });
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
  const lineEvents = winning
    ? []
    : rewardedLines.map(eventForLine).filter((event): event is PlacementPatternEvent => event !== null);
  const events: PlacementPatternEvent[] = [...lineEvents];
  if (lineEvents.length >= 2) events.push({ kind: 'multi-threat', count: lineEvents.length });

  return {
    actor,
    at,
    lines: rewardedLines,
    events,
    reward: rewardedLines.reduce((sum, line) => sum + line.reward, 0),
    winning,
    adjacentFriendlyCount,
    adjacentEnemy,
  };
}
