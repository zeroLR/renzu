import { isInsideBoard, isWinningMove, type Board, type Player, type Position } from '../board/board';
import { activePlayer, appendAction, completeTurn, endMatch, isBoardFull, type MatchState } from '../match/match-state';
import {
  advanceBoardEffectsAfterTurn,
  createBoardEffect,
  isBlocked,
  isGuarded,
  type BoardEffect,
} from '../combat/board-effects';
import {
  advanceAbilityEconomyAfterTurn,
  canActivate,
  consumeActivation,
  type AbilityActivationRule,
} from '../../heroes/economies/ability-economy';
import type { AbilityStates } from '../../heroes/economies/ability-state';
import { heroes, isAbilityAccessible, type AbilityId, type HeroId } from '../../heroes/domain/hero-definition';
import { applyAfterAbilityPassive, type PassiveOutcome } from '../../heroes/domain/passive-engine';

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
  | 'requires-placement'
  | 'invalid-target';

export type AbilityActionResult =
  | { ok: true; state: AbilityActionState; consumedTurn: true; passive: PassiveOutcome }
  | { ok: false; state: AbilityActionState; consumedTurn: false; error: AbilityActionError };

const DEFAULT_ACTIVATIONS: Partial<Record<AbilityId, AbilityActivationRule>> = {
  seal: { kind: 'resource', resourceId: 'mana', amount: 2 },
  corrupt: { kind: 'resource', resourceId: 'mana', amount: 3 },
  charge: { kind: 'resource', resourceId: 'mana', amount: 3 },
  bulwark: { kind: 'resource', resourceId: 'mana', amount: 3 },
  phase: { kind: 'resource', resourceId: 'mana', amount: 3 },
};

const DENIAL_ABILITIES = new Set<AbilityId>(['seal', 'phase', 'corrupt']);

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function adjacent(a: Position, b: Position): boolean {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

function adjacentFriendlyPositions(board: Board, at: Position, actor: Player): Position[] {
  const positions: Position[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const candidate = { row: at.row + dr, col: at.col + dc };
      if (board[candidate.row]?.[candidate.col] === actor) positions.push(candidate);
    }
  }
  return positions;
}

function hasAdjacentFriendly(board: Board, at: Position, actor: Player): boolean {
  return adjacentFriendlyPositions(board, at, actor).length > 0;
}

function cardinalOpenCells(board: Board, effects: readonly BoardEffect[], target: Position): Position[] {
  return ([[-1, 0], [1, 0], [0, -1], [0, 1]] as const)
    .map(([dr, dc]) => ({ row: target.row + dr, col: target.col + dc }))
    .filter((position) =>
      isInsideBoard(board, position.row, position.col)
      && board[position.row][position.col] === 0
      && !isBlocked(effects, position),
    );
}

function openPlacementPositions(board: Board, effects: readonly BoardEffect[]): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] !== 0) continue;
      const at = { row, col };
      if (!isBlocked(effects, at)) positions.push(at);
    }
  }
  return positions;
}

function hasEmptyCell(board: Board): boolean {
  return board.some((row) => row.some((cell) => cell === 0));
}

/**
 * Denial may shape future placement choices, but it must not create a
 * deterministic no-placement turn while its temporary blockers are alive.
 *
 * We simulate the conservative placement-only runway from the next actor.
 * Because temporary blockers expire only through turn advancement, consuming
 * one currently open intersection per turn is the shortest path to a lock.
 */
function preservesPlacementRunway(
  board: Board,
  effects: readonly BoardEffect[],
  actor: Player,
): boolean {
  const simulatedBoard = cloneBoard(board);
  let simulatedEffects = effects.map((effect) => ({
    ...effect,
    at: { ...effect.at },
    expiry: { ...effect.expiry },
  }));
  let nextActor: Player = actor === 1 ? 2 : 1;

  for (let step = 0; step < 16; step += 1) {
    if (!hasEmptyCell(simulatedBoard)) return true;

    const placements = openPlacementPositions(simulatedBoard, simulatedEffects);
    if (placements.length === 0) return false;

    const blockingEffectsRemain = simulatedEffects.some((effect) =>
      effect.kind === 'seal' || effect.kind === 'flame' || effect.kind === 'corruption',
    );
    if (!blockingEffectsRemain) return true;

    const at = placements[0];
    simulatedBoard[at.row][at.col] = nextActor;
    simulatedEffects = [...advanceBoardEffectsAfterTurn(simulatedEffects, nextActor)];
    nextActor = nextActor === 1 ? 2 : 1;
  }

  return true;
}

function resolveBoardMutation(state: AbilityActionState, intent: AbilityIntent): AbilityActionState | null {
  const { abilityId, actor, target, source } = intent;
  const board = cloneBoard(state.match.board);
  const enemy: Player = actor === 1 ? 2 : 1;
  const effects = [...state.boardEffects];

  if (!isInsideBoard(board, target.row, target.col)) return null;

  if (abilityId === 'bulwark') {
    if (board[target.row][target.col] !== actor || isGuarded(effects, target)) return null;
    const adjacentFriendly = adjacentFriendlyPositions(board, target, actor);
    if (adjacentFriendly.length === 0) return null;
    for (const position of [target, ...adjacentFriendly]) {
      if (!isGuarded(effects, position)) {
        effects.push(createBoardEffect('guard', position, actor, { kind: 'owner-turns', remaining: 2 }));
      }
    }
  } else if (abilityId === 'seal') {
    if (board[target.row][target.col] !== 0 || isBlocked(effects, target)) return null;
    effects.push(createBoardEffect('seal', target, actor, { kind: 'opponent-turns', remaining: 2 }));
  } else if (abilityId === 'corrupt') {
    if (board[target.row][target.col] !== enemy || isGuarded(effects, target) || !hasAdjacentFriendly(board, target, actor)) return null;
    board[target.row][target.col] = 0;
    effects.push(createBoardEffect('corruption', target, actor, { kind: 'opponent-turns', remaining: 1 }));
  } else if (abilityId === 'charge') {
    if (!source || !isInsideBoard(board, source.row, source.col) || board[source.row][source.col] !== actor || !adjacent(source, target)) return null;
    if (isGuarded(effects, source) || isBlocked(effects, target)) return null;
    if (board[target.row][target.col] === 0) {
      board[source.row][source.col] = 0;
      board[target.row][target.col] = actor;
    } else if (board[target.row][target.col] === enemy) {
      if (isGuarded(effects, target)) return null;
      const pushed = { row: target.row + (target.row - source.row), col: target.col + (target.col - source.col) };
      if (!isInsideBoard(board, pushed.row, pushed.col) || board[pushed.row][pushed.col] !== 0 || isBlocked(effects, pushed)) return null;
      board[pushed.row][pushed.col] = enemy;
      board[target.row][target.col] = actor;
      board[source.row][source.col] = 0;
    } else {
      return null;
    }
  } else if (abilityId === 'phase') {
    if (board[target.row][target.col] !== 0 || isBlocked(effects, target)) return null;
    board[target.row][target.col] = actor;
    for (const position of cardinalOpenCells(board, effects, target)) {
      effects.push(createBoardEffect('flame', position, actor, { kind: 'opponent-turns', remaining: 1 }));
    }
  } else {
    return null;
  }

  return { ...state, match: { ...state.match, board }, boardEffects: effects };
}

export function resolveAbilityAction(state: AbilityActionState, intent: AbilityIntent): AbilityActionResult {
  if (state.match.status !== 'playing') return { ok: false, state, consumedTurn: false, error: 'match-over' };
  if (activePlayer(state.match) !== intent.actor) return { ok: false, state, consumedTurn: false, error: 'wrong-phase' };
  if (!isAbilityAccessible(intent.heroId, intent.abilityId)) return { ok: false, state, consumedTurn: false, error: 'ability-unavailable' };
  if (intent.abilityId === 'guard') return { ok: false, state, consumedTurn: false, error: 'requires-placement' };

  const activation = heroes[intent.heroId].activationOverrides[intent.abilityId] ?? DEFAULT_ACTIVATIONS[intent.abilityId];
  if (!activation) return { ok: false, state, consumedTurn: false, error: 'activation-unavailable' };
  if (!canActivate(state.abilities, intent.actor, activation, intent.abilityId).ready) {
    return { ok: false, state, consumedTurn: false, error: 'activation-unavailable' };
  }

  const mutated = resolveBoardMutation(state, intent);
  if (!mutated) return { ok: false, state, consumedTurn: false, error: 'invalid-target' };

  const boardChangedAtTarget = mutated.match.board[intent.target.row]?.[intent.target.col] === intent.actor;
  const winsAtTarget = boardChangedAtTarget && isWinningMove(mutated.match.board, intent.target, intent.actor);
  if (DENIAL_ABILITIES.has(intent.abilityId)
    && !winsAtTarget
    && !preservesPlacementRunway(mutated.match.board, mutated.boardEffects, intent.actor)) {
    return { ok: false, state, consumedTurn: false, error: 'invalid-target' };
  }

  const advancedAbilities = advanceAbilityEconomyAfterTurn(mutated.abilities, intent.actor);
  const consumedAbilities = consumeActivation(advancedAbilities, intent.actor, activation, intent.abilityId);
  const passive = applyAfterAbilityPassive(consumedAbilities, intent.heroId, intent.actor);
  let match = appendAction(mutated.match, {
    actor: intent.actor,
    kind: 'ability',
    at: intent.target,
    source: intent.source,
    abilityId: intent.abilityId,
  });

  if (winsAtTarget) {
    match = endMatch(match, intent.actor === 1 ? 'victory' : 'defeat');
  } else if (isBoardFull(match)) {
    match = endMatch(match, 'draw');
  }

  let boardEffects = mutated.boardEffects;
  if (match.status === 'playing') {
    boardEffects = advanceBoardEffectsAfterTurn(boardEffects, intent.actor);
    match = completeTurn(match, intent.actor);
  }

  return {
    ok: true,
    state: { ...mutated, match, abilities: passive.states, boardEffects },
    consumedTurn: true,
    passive,
  };
}
