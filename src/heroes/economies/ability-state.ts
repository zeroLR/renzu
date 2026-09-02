import type { Player } from '../../game/board/board';

export type AbilityKey = string;
export type ResourceId = 'mana' | 'pressure' | 'momentum' | 'focus' | 'formation';

export interface ActorAbilityState {
  resources: Record<ResourceId, number>;
  cooldowns: Record<AbilityKey, number>;
  conditions: Record<AbilityKey, boolean>;
  charges: Record<AbilityKey, number>;
  usesSpent: Record<AbilityKey, number>;
}

export type AbilityStates = Record<Player, ActorAbilityState>;

export function createActorAbilityState(): ActorAbilityState {
  return {
    resources: {
      mana: 0,
      pressure: 0,
      momentum: 0,
      focus: 0,
      formation: 0,
    },
    cooldowns: {},
    conditions: {},
    charges: {},
    usesSpent: {},
  };
}

export function createAbilityStates(): AbilityStates {
  return {
    1: createActorAbilityState(),
    2: createActorAbilityState(),
  };
}

export function updateActorAbilityState(
  states: AbilityStates,
  player: Player,
  update: (state: ActorAbilityState) => ActorAbilityState,
): AbilityStates {
  return {
    ...states,
    [player]: update(states[player]),
  };
}
