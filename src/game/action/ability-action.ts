import { isInsideBoard, isWinningMove, type Board, type Player, type Position } from '../board/board';
import { activePlayer, appendAction, completeTurn, endMatch, isBoardFull, type MatchState } from '../match/match-state';
import { canActivate, consumeActivation, type AbilityActivationRule } from '../../heroes/economies/ability-economy';
import type { AbilityStates } from '../../heroes/economies/ability-state';
import { heroes, isAbilityAccessible, type AbilityId, type HeroId } from '../../heroes/domain/hero-definition';
import { applyAfterAbilityPassive, type PassiveOutcome } from '../../heroes/domain/passive-engine';

export type BoardEffect =
  | { kind: 'guard'; at: Position; owner: Player }
  | { kind: 'seal'; at: Position; owner: Player }
  | { kind: 'corruption'; at: Position; owner: Player };

export interface AbilityActionState {
  match: MatchState;
  abilities: AbilityStates;
  boardEffects: readonly BoardEffect[];
}

export interface AbilityIntent {
  heroId: HeroId;
  abilityId: AbilityId;
  actor: Player;
  target: Position;
  source?: Position;
}

export type AbilityActionError =
  | 'match-over'
  | 'wrong-phase'
  | 'ability-unavailable'
  | 'activation-unavailable'
  | 'invalid-target';

export type AbilityActionResult =
  | { ok: true; state: AbilityActionState; consumedTurn: boolean; passive: PassiveOutcome }
  | { ok: false; state: AbilityActionState; consumedTurn: false; error: AbilityActionError };

const DEFAULT_ACTIVATIONS: Partial<Record<AbilityId, AbilityActivationRule>> = {
  blink: { kind: 'resource', resourceId: 'mana', amount: 2 },
  guard: { kind: 'resource', resourceId: 'mana', amount: 2 },
  seal: { kind: 'resource', resourceId: 'mana', amount: 2 },
  corrupt: { kind: 'resource', resourceId: 'mana', amount: 3 },
  charge: { kind: 'resource', resourceId: 'mana', amount: 3 },
  bulwark: { kind: 'resource', resourceId: 'mana', amount: 3 },
  phase: { kind: 'resource', resourceId: 'mana', amount: 3 },
  rally: { kind: 'resource', resourceId: 'mana', amount: 2 },
  lattice: { kind: 'resource', resourceId: 'mana', amount: 3 },
  step: { kind: 'resource', resourceId: 'mana', amount: 1 },
  sever: { kind: 'resource', resourceId: 'mana', amount: 3 },
};

function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function isGuarded(effects: readonly BoardEffect[], at: Position): boolean {
  return effects.some((effect) => effect.kind === 'guard' && samePosition(effect.at, at));
}

function isBlocked(effects: readonly BoardEffect[], at: Position): boolean {
  return effects.some((effect) => (effect.kind === 'seal' || effect.kind === 'corruption') && samePosition(effect.at, at));
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function adjacent(a: Position, b: Position): boolean {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

function hasAdjacentFriendly(board: Board, at: Position, actor: Player): boolean {
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      if (board[at.row + dr]?.[at.col + dc] === actor) return true;
    }
  }
  return false;
}

function resolveBoardMutation(state: AbilityActionState, intent: AbilityIntent): AbilityActionState | null {
  const { abilityId, actor, target, source } = intent;
  const board = cloneBoard(state.match.board);
  const enemy: Player = actor === 1 ? 2 : 1;
  const effects = [...state.boardEffects];

  if (!isInsideBoard(board, target.row, target.col)) return null;

  if (abilityId === 'blink') {
    if (!source || !isInsideBoard(board, source.row, source.col) || board[source.row][source.col] !== actor) return null;
    if (board[target.row][target.col] !== 0 || isBlocked(effects, target) || isGuarded(effects, source)) return null;
    board[source.row][source.col] = 0;
    board[target.row][target.col] = actor;
  } else if (abilityId === 'guard') {
    if (board[target.row][target.col] !== actor || isGuarded(effects, target)) return null;
    effects.push({ kind: 'guard', at: target, owner: actor });
  } else if (abilityId === 'seal') {
    if (board[target.row][target.col] !== 0 || isBlocked(effects, target)) return null;
    effects.push({ kind: 'seal', at: target, owner: actor });
  } else if (abilityId === 'corrupt') {
    if (board[target.row][target.col] !== enemy || isGuarded(effects, target) || !hasAdjacentFriendly(board, target, actor)) return null;
    board[target.row][target.col] = 0;
    effects.push({ kind: 'corruption', at: target, owner: actor });
  } else if (abilityId === 'phase') {
    if (board[target.row][target.col] !== 0 || isBlocked(effects, target)) return null;
    board[target.row][target.col] = actor;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const at = { row: target.row + dr, col: target.col + dc };
      if (isInsideBoard(board, at.row, at.col) && board[at.row][at.col] === 0 && !isBlocked(effects, at)) {
        effects.push({ kind: 'seal', at, owner: actor });
      }
    }
  } else if (abilityId === 'step') {
    return state;
  } else if (abilityId === 'sever') {
    if (!source || board[source.row]?.[source.col] !== actor || board[target.row][target.col] !== enemy || !adjacent(source, target) || isGuarded(effects, target)) return null;
    const pushed = { row: target.row + (target.row - source.row), col: target.col + (target.col - source.col) };
    if (!isInsideBoard(board, pushed.row, pushed.col) || board[pushed.row][pushed.col] !== 0 || isBlocked(effects, pushed)) return null;
    board[pushed.row][pushed.col] = enemy;
    board[target.row][target.col] = 0;
  } else {
    return null;
  }

  return { ...state, match: { ...state.match, board }, boardEffects: effects };
}

export function resolveAbilityAction(state: AbilityActionState, intent: AbilityIntent): AbilityActionResult {
  if (state.match.status !== 'playing') return { ok: false, state, consumedTurn: false, error: 'match-over' };
  if (activePlayer(state.match) !== intent.actor) return { ok: false, state, consumedTurn: false, error: 'wrong-phase' };
  if (!isAbilityAccessible(intent.heroId, intent.abilityId)) return { ok: false, state, consumedTurn: false, error: 'ability-unavailable' };

  const activation = heroes[intent.heroId].activationOverrides[intent.abilityId] ?? DEFAULT_ACTIVATIONS[intent.abilityId];
  if (!activation || !canActivate(state.abilities, intent.actor, activation, intent.abilityId).ready) {
    return { ok: false, state, consumedTurn: false, error: 'activation-unavailable' };
  }

  const mutated = resolveBoardMutation(state, intent);
  if (!mutated) return { ok: false, state, consumedTurn: false, error: 'invalid-target' };

  const consumedAbilities = consumeActivation(mutated.abilities, intent.actor, activation, intent.abilityId);
  const passive = applyAfterAbilityPassive(consumedAbilities, intent.heroId, intent.actor);
  let match = appendAction(mutated.match, {
    actor: intent.actor,
    kind: 'ability',
    at: intent.target,
    source: intent.source,
    abilityId: intent.abilityId,
  });

  const boardChangedAtTarget = match.board[intent.target.row]?.[intent.target.col] === intent.actor;
  if (boardChangedAtTarget && isWinningMove(match.board, intent.target, intent.actor)) {
    match = endMatch(match, intent.actor === 1 ? 'victory' : 'defeat');
  } else if (isBoardFull(match)) {
    match = endMatch(match, 'draw');
  }

  const consumedTurn = intent.abilityId !== 'step';
  if (consumedTurn && match.status === 'playing') match = completeTurn(match, intent.actor);

  return {
    ok: true,
    state: { ...mutated, match, abilities: passive.states },
    consumedTurn,
    passive,
  };
}
