import type { Player } from '../../game/board/board';
import {
  type AbilityKey,
  type AbilityStates,
  type ResourceId,
  updateActorAbilityState,
} from './ability-state';

export type AbilityEconomyKind =
  | 'resource'
  | 'cooldown'
  | 'conditional'
  | 'momentum'
  | 'formation'
  | 'charge'
  | 'limited-use';

export type AbilityConditionId = string;
export type AbilityId = string;

export type AbilityActivationRule =
  | { kind: 'resource'; resourceId: ResourceId; amount: number }
  | { kind: 'cooldown'; turns: number }
  | { kind: 'condition'; conditionId: AbilityConditionId }
  | { kind: 'resource-and-condition'; resourceId: ResourceId; amount: number; conditionId: AbilityConditionId }
  | { kind: 'limited-use'; uses: number };

export type ActivationFailureReason =
  | 'insufficient-resource'
  | 'cooldown'
  | 'condition'
  | 'limited-use'
  | 'missing-ability-id';

export type ActivationReadiness = { ready: true } | { ready: false; reason: ActivationFailureReason };

export function getAbilityResource(states: AbilityStates, player: Player, resourceId: ResourceId): number {
  return states[player].resources[resourceId] ?? 0;
}

export function setAbilityResource(
  states: AbilityStates,
  player: Player,
  resourceId: ResourceId,
  value: number,
): AbilityStates {
  return updateActorAbilityState(states, player, (actor) => ({
    ...actor,
    resources: {
      ...actor.resources,
      [resourceId]: Math.max(0, value),
    },
  }));
}

export function setAbilityCondition(
  states: AbilityStates,
  player: Player,
  conditionId: AbilityConditionId,
  active: boolean,
): AbilityStates {
  return updateActorAbilityState(states, player, (actor) => ({
    ...actor,
    conditions: {
      ...actor.conditions,
      [conditionId]: active,
    },
  }));
}

export function getAbilityCooldown(states: AbilityStates, player: Player, abilityId: AbilityId): number {
  return states[player].cooldowns[abilityId] ?? 0;
}

export function getAbilityCharge(states: AbilityStates, player: Player, abilityId: AbilityId): number {
  return states[player].charges[abilityId] ?? 0;
}

export function getAbilityUsesSpent(states: AbilityStates, player: Player, abilityId: AbilityId): number {
  return states[player].usesSpent[abilityId] ?? 0;
}

export function canActivate(
  states: AbilityStates,
  player: Player,
  activation: AbilityActivationRule,
  abilityId?: AbilityId,
): ActivationReadiness {
  if (activation.kind === 'resource') {
    return getAbilityResource(states, player, activation.resourceId) >= activation.amount
      ? { ready: true }
      : { ready: false, reason: 'insufficient-resource' };
  }

  if (activation.kind === 'resource-and-condition') {
    if (!states[player].conditions[activation.conditionId]) {
      return { ready: false, reason: 'condition' };
    }
    return getAbilityResource(states, player, activation.resourceId) >= activation.amount
      ? { ready: true }
      : { ready: false, reason: 'insufficient-resource' };
  }

  if (activation.kind === 'condition') {
    return states[player].conditions[activation.conditionId]
      ? { ready: true }
      : { ready: false, reason: 'condition' };
  }

  if (!abilityId) return { ready: false, reason: 'missing-ability-id' };

  if (activation.kind === 'cooldown') {
    return getAbilityCooldown(states, player, abilityId) <= 0
      ? { ready: true }
      : { ready: false, reason: 'cooldown' };
  }

  return getAbilityUsesSpent(states, player, abilityId) < activation.uses
    ? { ready: true }
    : { ready: false, reason: 'limited-use' };
}

export function consumeActivation(
  states: AbilityStates,
  player: Player,
  activation: AbilityActivationRule,
  abilityId?: AbilityId,
): AbilityStates {
  if (!canActivate(states, player, activation, abilityId).ready) return states;

  if (activation.kind === 'resource' || activation.kind === 'resource-and-condition') {
    return setAbilityResource(
      states,
      player,
      activation.resourceId,
      getAbilityResource(states, player, activation.resourceId) - activation.amount,
    );
  }

  if (activation.kind === 'cooldown' && abilityId) {
    return updateAbilityMap(states, player, 'cooldowns', abilityId, activation.turns);
  }

  if (activation.kind === 'limited-use' && abilityId) {
    return updateAbilityMap(states, player, 'usesSpent', abilityId, getAbilityUsesSpent(states, player, abilityId) + 1);
  }

  return states;
}

export function advanceAbilityEconomyAfterTurn(states: AbilityStates, player: Player): AbilityStates {
  return updateActorAbilityState(states, player, (actor) => ({
    ...actor,
    cooldowns: Object.fromEntries(
      Object.entries(actor.cooldowns).map(([id, remaining]) => [id, Math.max(0, remaining - 1)]),
    ),
  }));
}

function updateAbilityMap(
  states: AbilityStates,
  player: Player,
  key: 'cooldowns' | 'charges' | 'usesSpent',
  abilityId: AbilityKey,
  value: number,
): AbilityStates {
  return updateActorAbilityState(states, player, (actor) => ({
    ...actor,
    [key]: {
      ...actor[key],
      [abilityId]: Math.max(0, value),
    },
  }));
}
