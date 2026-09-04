import type { AiDifficultyId } from '../../ai/difficulty/difficulty-profile';
import type { HeroId } from '../../heroes/domain/hero-definition';
import type { PlayerProfile } from '../../progression/profile/player-profile';

export interface FreeBattleSessionConfig {
  mode: 'free-battle';
  playerHeroId: HeroId;
  cpuHeroId: HeroId;
  cpuDifficulty: AiDifficultyId;
}

export type FreeBattleConfigError = 'hero-locked';

export function createFreeBattleSessionConfig(
  profile: PlayerProfile,
  input: Omit<FreeBattleSessionConfig, 'mode'>,
): FreeBattleSessionConfig | FreeBattleConfigError {
  if (!profile.unlockedHeroes.includes(input.playerHeroId)) return 'hero-locked';
  return { mode: 'free-battle', ...input };
}
