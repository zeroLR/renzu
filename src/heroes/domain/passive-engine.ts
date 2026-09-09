import type { PlacementPatternOutcome } from '../../game/rules/placement-pattern';
import {
  getAbilityResource,
  setAbilityResource,
} from '../economies/ability-economy';
import type { AbilityStates, ResourceId } from '../economies/ability-state';
import type { HeroId } from './hero-definition';

export interface PassiveOutcome {
  states: AbilityStates;
  triggered: boolean;
  resourceGained?: { resourceId: ResourceId; amount: number };
  boardEffect?: 'guard';
}

export interface AfterPlaceContext {
  pattern: PlacementPatternOutcome;
}

function gainResource(
  states: AbilityStates,
  actor: 1 | 2,
  resourceId: ResourceId,
  amount: number,
  max: number,
): PassiveOutcome {
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
  const { actor, reward, adjacentEnemy } = context.pattern;

  if (heroId === 'vanguard') {
    return reward > 0 ? { states, triggered: true, boardEffect: 'guard' } : { states, triggered: false };
  }

  if (heroId === 'arcanist') {
    return reward > 0
      ? gainResource(states, actor, 'mana', reward, 5)
      : { states, triggered: false };
  }

  if (heroId === 'shade') {
    return adjacentEnemy
      ? gainResource(states, actor, 'pressure', 1, 3)
      : { states, triggered: false };
  }

  return { states, triggered: false };
}

export function applyAfterAbilityPassive(states: AbilityStates, heroId: HeroId, actor: 1 | 2): PassiveOutcome {
  return heroId === 'arcanist'
    ? gainResource(states, actor, 'mana', 1, 5)
    : { states, triggered: false };
}
