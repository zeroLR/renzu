import type { AiDifficultyId } from '../../ai/difficulty/difficulty-profile';
import type { HeroId } from '../../heroes/domain/hero-definition';
import { createFreeBattleSessionConfig } from '../../modes/free-battle/free-battle-config';
import type { PlayerProfileStorage } from '../../platform/storage/player-profile-storage';
import type { PlayerProfile, StoryEncounterId } from '../../progression/profile/player-profile';
import { createGameSession, type GameSession } from './create-game-session';
import { createStoryGameSessionConfig, fromFreeBattleConfig } from './game-session-config';

export interface FreeBattleSelection {
  playerHeroId: HeroId;
  cpuHeroId: HeroId;
  cpuDifficulty: AiDifficultyId;
}

export interface ProductFlowSnapshot {
  profile: PlayerProfile;
  freeBattle: FreeBattleSelection;
  session: GameSession | null;
}

export type StartSessionResult =
  | { ok: true; session: GameSession }
  | { ok: false; error: 'hero-locked' | 'encounter-not-found' | 'encounter-locked' };

export interface ProductFlow {
  snapshot(): ProductFlowSnapshot;
  selectPlayerHero(heroId: HeroId): ProductFlowSnapshot;
  selectCpuHero(heroId: HeroId): ProductFlowSnapshot;
  selectDifficulty(difficulty: AiDifficultyId): ProductFlowSnapshot;
  startFreeBattle(): StartSessionResult;
  startStory(encounterId: StoryEncounterId): StartSessionResult;
  clearSession(): ProductFlowSnapshot;
}

export function createProductFlow(storage: PlayerProfileStorage): ProductFlow {
  let profile = storage.load();
  let freeBattle: FreeBattleSelection = {
    playerHeroId: profile.unlockedHeroes[0] ?? 'vanguard',
    cpuHeroId: 'vanguard',
    cpuDifficulty: 'normal',
  };
  let session: GameSession | null = null;

  const snapshot = (): ProductFlowSnapshot => ({ profile, freeBattle: { ...freeBattle }, session });

  return {
    snapshot,
    selectPlayerHero(heroId) {
      freeBattle = { ...freeBattle, playerHeroId: heroId };
      return snapshot();
    },
    selectCpuHero(heroId) {
      freeBattle = { ...freeBattle, cpuHeroId: heroId };
      return snapshot();
    },
    selectDifficulty(difficulty) {
      freeBattle = { ...freeBattle, cpuDifficulty: difficulty };
      return snapshot();
    },
    startFreeBattle() {
      const config = createFreeBattleSessionConfig(profile, freeBattle);
      if (config === 'hero-locked') return { ok: false, error: config };
      session = createGameSession(fromFreeBattleConfig(config));
      return { ok: true, session };
    },
    startStory(encounterId) {
      const config = createStoryGameSessionConfig(profile, encounterId);
      if (typeof config === 'string') return { ok: false, error: config };
      session = createGameSession(config);
      return { ok: true, session };
    },
    clearSession() {
      session = null;
      return snapshot();
    },
  };
}
