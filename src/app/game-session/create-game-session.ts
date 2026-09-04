import { createActionTimingState } from '../../game/action/action-timing';
import type { AbilityActionState } from '../../game/action/ability-action';
import { createMatchState } from '../../game/match/match-state';
import { createAbilityStates } from '../../heroes/economies/ability-state';
import type { GameSessionConfig } from './game-session-config';

export interface GameSession {
  config: GameSessionConfig;
  state: AbilityActionState;
}

export function createGameSession(config: GameSessionConfig): GameSession {
  return {
    config,
    state: {
      match: createMatchState(),
      abilities: createAbilityStates(),
      boardEffects: [],
      timing: createActionTimingState(),
    },
  };
}
