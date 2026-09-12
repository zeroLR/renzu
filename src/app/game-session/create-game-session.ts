import type { AiDifficultyProfile } from '../../ai/difficulty/difficulty-profile';
import type { AbilityActionState } from '../../game/action/ability-action';
import { createMatchState } from '../../game/match/match-state';
import { createAbilityStates } from '../../heroes/economies/ability-state';
import type { GameSessionConfig } from './game-session-config';

export interface GameSession {
  config: GameSessionConfig;
  state: AbilityActionState;
  cpuProfileOverride?: AiDifficultyProfile;
}

export function createGameSession(config: GameSessionConfig): GameSession {
  return {
    config,
    state: {
      match: createMatchState(),
      abilities: createAbilityStates(),
      boardEffects: [],
    },
  };
}
