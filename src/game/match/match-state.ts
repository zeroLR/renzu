import { createBoard, emptyCells, type Board, type Player, type Position } from '../board/board';

export type MatchStatus = 'playing' | 'victory' | 'defeat' | 'draw';
export type TurnPhase = 'player' | 'opponent' | 'over';

export type MatchActionKind = 'place' | 'ability';

export interface MatchActionRecord {
  turn: number;
  actor: Player;
  kind: MatchActionKind;
  at: Position;
  source?: Position;
  abilityId?: string;
}

export interface MatchState {
  board: Board;
  turn: number;
  phase: TurnPhase;
  status: MatchStatus;
  actionHistory: MatchActionRecord[];
}

export function createMatchState(board: Board = createBoard()): MatchState {
  return {
    board,
    turn: 1,
    phase: 'player',
    status: 'playing',
    actionHistory: [],
  };
}

export function activePlayer(state: MatchState): Player | null {
  if (state.status !== 'playing') return null;
  return state.phase === 'player' ? 1 : state.phase === 'opponent' ? 2 : null;
}

export function acceptsPlayerInput(state: MatchState): boolean {
  return state.status === 'playing' && state.phase === 'player';
}

export function isMatchOver(state: MatchState): boolean {
  return state.status !== 'playing';
}

export function isBoardFull(state: MatchState): boolean {
  return emptyCells(state.board).length === 0;
}

export function completeTurn(state: MatchState, actor: Player): MatchState {
  if (state.status !== 'playing') return state;
  if (actor === 1) {
    return { ...state, turn: state.turn + 1, phase: 'opponent' };
  }
  return { ...state, phase: 'player' };
}

export function endMatch(state: MatchState, status: Exclude<MatchStatus, 'playing'>): MatchState {
  return { ...state, status, phase: 'over' };
}

export function appendAction(state: MatchState, action: Omit<MatchActionRecord, 'turn'>): MatchState {
  return {
    ...state,
    actionHistory: [...state.actionHistory, { ...action, turn: state.turn }],
  };
}
