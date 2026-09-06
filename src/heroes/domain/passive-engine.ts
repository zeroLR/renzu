import type { PlacementPatternOutcome } from '../../game/rules/placement-pattern';
import {
  getAbilityCharge,
  getAbilityResource,
  setAbilityCharge,
  setAbilityCondition,
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
  preserveMomentum?: boolean;
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
  const { actor, reward, adjacentFriendlyCount, adjacentEnemy } = context.pattern;

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

  if (heroId === 'architect') {
    const ready = adjacentFriendlyCount >= 2;
    return {
      states: setAbilityCondition(states, actor, 'formation-ready', ready),
      triggered: ready,
    };
  }

  if (heroId === 'swordmaster') {
    if (reward > 0) {
      const chargeBefore = getAbilityCharge(states, actor, 'step');
      const charged = setAbilityCharge(states, actor, 'step', 1);
      const momentum = gainResource(charged, actor, 'momentum', reward, 3);
      return chargeBefore < 1 && !momentum.triggered
        ? { states: momentum.states, triggered: true }
        : momentum;
    }

    if (context.preserveMomentum && getAbilityCharge(states, actor, 'step') > 0) {
      return {
        states: setAbilityCharge(states, actor, 'step', 0),
        triggered: false,
      };
    }

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

export function applyAfterAbilityPassive(states: AbilityStates, heroId: HeroId, actor: 1 | 2): PassiveOutcome {
  return heroId === 'arcanist'
    ? gainResource(states, actor, 'mana', 1, 5)
    : { states, triggered: false };
}
