import { isInsideBoard, isWinningMove, type Board, type Player, type Position } from '../board/board';
import { activePlayer, appendAction, completeTurn, endMatch, isBoardFull, type MatchState } from '../match/match-state';

export type PlaceActionError = 'match-over' | 'wrong-phase' | 'out-of-bounds' | 'occupied';

export type PlaceActionResult =
  | {
      ok: true;
      state: MatchState;
      actor: Player;
      at: Position;
      won: boolean;
      draw: boolean;
      consumedTurn: true;
    }
  | {
      ok: false;
      state: MatchState;
      at: Position;
      consumedTurn: false;
      error: PlaceActionError;
    };

function inBounds(board: Board, at: Position): boolean {
  return isInsideBoard(board, at.row, at.col);
}

export function resolvePlaceAction(state: MatchState, actor: Player, at: Position): PlaceActionResult {
  if (state.status !== 'playing') {
    return { ok: false, state, at, consumedTurn: false, error: 'match-over' };
  }

  if (activePlayer(state) !== actor) {
    return { ok: false, state, at, consumedTurn: false, error: 'wrong-phase' };
  }

  if (!inBounds(state.board, at)) {
    return { ok: false, state, at, consumedTurn: false, error: 'out-of-bounds' };
  }

  if (state.board[at.row][at.col] !== 0) {
    return { ok: false, state, at, consumedTurn: false, error: 'occupied' };
  }

  const board = state.board.map((row) => [...row]);
  board[at.row][at.col] = actor;

  let next: MatchState = appendAction({ ...state, board }, { actor, kind: 'place', at });
  const won = isWinningMove(board, at, actor);

  if (won) {
    next = endMatch(next, actor === 1 ? 'victory' : 'defeat');
    return { ok: true, state: next, actor, at, won: true, draw: false, consumedTurn: true };
  }

  const draw = isBoardFull(next);
  if (draw) {
    next = endMatch(next, 'draw');
    return { ok: true, state: next, actor, at, won: false, draw: true, consumedTurn: true };
  }

  next = completeTurn(next, actor);
  return { ok: true, state: next, actor, at, won: false, draw: false, consumedTurn: true };
}
