import type { Board, Player, Position } from '../../game/board/board';
import { getAbilityResource, setAbilityCondition, setAbilityResource } from '../economies/ability-economy';
import type { AbilityStates, ResourceId } from '../economies/ability-state';
import type { HeroId } from './hero-definition';

export interface PassiveOutcome {
  states: AbilityStates;
  triggered: boolean;
  resourceGained?: { resourceId: ResourceId; amount: number };
  boardEffect?: 'guard';
}

export interface AfterPlaceContext {
  board: Board;
  actor: Player;
  at: Position;
  patternReward: number;
  preserveMomentum?: boolean;
}

function hasAdjacentEnemy(board: Board, at: Position, actor: Player): boolean {
  const enemy: Player = actor === 1 ? 2 : 1;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      if (board[at.row + dr]?.[at.col + dc] === enemy) return true;
    }
  }
  return false;
}

function adjacentFriendlyCount(board: Board, at: Position, actor: Player): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      if (board[at.row + dr]?.[at.col + dc] === actor) count += 1;
    }
  }
  return count;
}

function gainResource(states: AbilityStates, actor: Player, resourceId: ResourceId, amount: number, max: number): PassiveOutcome {
  const before = getAbilityResource(states, actor, resourceId);
  const after = Math.min(max, before + amount);
  if (after === before) return { states, triggered: false };
  return {
    states: setAbilityResource(states, actor, resourceId, after),
    triggered: true,
    resourceGained: { resourceId, amount: after - before },
  };
}

export function applyAfterPlacePassive(
  states: AbilityStates,
  heroId: HeroId,
  context: AfterPlaceContext,
): PassiveOutcome {
  const { actor, at, board, patternReward } = context;

  if (heroId === 'vanguard') {
    return patternReward > 0 ? { states, triggered: true, boardEffect: 'guard' } : { states, triggered: false };
  }

  if (heroId === 'shade') {
    return hasAdjacentEnemy(board, at, actor)
      ? gainResource(states, actor, 'pressure', 1, 3)
      : { states, triggered: false };
  }

  if (heroId === 'architect') {
    const ready = adjacentFriendlyCount(board, at, actor) >= 2;
    return {
      states: setAbilityCondition(states, actor, 'formation-ready', ready),
      triggered: ready,
    };
  }

  if (heroId === 'swordmaster') {
    if (patternReward > 0) return gainResource(states, actor, 'momentum', patternReward, 3);
    if (context.preserveMomentum) return { states, triggered: false };
    const before = getAbilityResource(states, actor, 'momentum');
    if (before <= 0) return { states, triggered: false };
    return {
      states: setAbilityResource(states, actor, 'momentum', before - 1),
      triggered: true,
      resourceGained: { resourceId: 'momentum', amount: -1 },
    };
  }

  return { states, triggered: false };
}

export function applyAfterAbilityPassive(states: AbilityStates, heroId: HeroId, actor: Player): PassiveOutcome {
  return heroId === 'arcanist'
    ? gainResource(states, actor, 'mana', 1, 5)
    : { states, triggered: false };
}
