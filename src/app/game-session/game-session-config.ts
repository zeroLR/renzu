import type { AiDifficultyId } from '../../ai/difficulty/difficulty-profile';
import type { HeroId } from '../../heroes/domain/hero-definition';
import type { FreeBattleSessionConfig } from '../../modes/free-battle/free-battle-config';
import { isStoryEncounterUnlocked, storyEncounter } from '../../modes/story/story-content';
import type { PlayerProfile, StoryEncounterId } from '../../progression/profile/player-profile';

export type GameSessionMode =
  | { kind: 'free-battle' }
  | { kind: 'story'; encounterId: StoryEncounterId };

export interface GameSessionConfig {
  mode: GameSessionMode;
  playerHeroId: HeroId;
  cpuHeroId: HeroId;
  cpuDifficulty: AiDifficultyId;
}

export type StorySessionConfigError = 'encounter-not-found' | 'encounter-locked';

export function fromFreeBattleConfig(config: FreeBattleSessionConfig): GameSessionConfig {
  return {
    mode: { kind: 'free-battle' },
    playerHeroId: config.playerHeroId,
    cpuHeroId: config.cpuHeroId,
    cpuDifficulty: config.cpuDifficulty,
  };
}

export function createStoryGameSessionConfig(
  profile: PlayerProfile,
  encounterId: StoryEncounterId,
): GameSessionConfig | StorySessionConfigError {
  const encounter = storyEncounter(encounterId);
  if (!encounter) return 'encounter-not-found';
  if (!isStoryEncounterUnlocked(profile, encounterId)) return 'encounter-locked';

  return {
    mode: { kind: 'story', encounterId },
    playerHeroId: encounter.playerHeroId,
    cpuHeroId: encounter.cpuHeroId,
    cpuDifficulty: encounter.cpuDifficulty,
  };
}
