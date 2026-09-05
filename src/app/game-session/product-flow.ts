import type { AiDifficultyId } from '../../ai/difficulty/difficulty-profile';
import type { HeroId } from '../../heroes/domain/hero-definition';
import { createFreeBattleSessionConfig } from '../../modes/free-battle/free-battle-config';
import { EASY_STORY_ENCOUNTERS } from '../../modes/story/story-content';
import type { PlayerProfileStorage } from '../../platform/storage/player-profile-storage';
import { completeStoryEncounter, type PlayerProfile, type StoryEncounterId } from '../../progression/profile/player-profile';
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
  | { ok: false; error: 'hero-locked' | 'encounter-not-found' | 'encounter-locked' | 'no-active-session' | 'next-encounter-unavailable' };

export interface SessionSettlement {
  settled: boolean;
  storyCompleted: StoryEncounterId | null;
  nextStoryEncounterId: StoryEncounterId | null;
}

export interface ProductFlow {
  snapshot(): ProductFlowSnapshot;
  selectPlayerHero(heroId: HeroId): ProductFlowSnapshot;
  selectCpuHero(heroId: HeroId): ProductFlowSnapshot;
  selectDifficulty(difficulty: AiDifficultyId): ProductFlowSnapshot;
  startFreeBattle(): StartSessionResult;
  startStory(encounterId: StoryEncounterId): StartSessionResult;
  settleActiveSession(): SessionSettlement;
  rematch(): StartSessionResult;
  startNextStoryEncounter(): StartSessionResult;
  clearSession(): ProductFlowSnapshot;
}

function nextEncounterId(currentId: StoryEncounterId): StoryEncounterId | null {
  const index = EASY_STORY_ENCOUNTERS.findIndex((encounter) => encounter.id === currentId);
  return index >= 0 && index < EASY_STORY_ENCOUNTERS.length - 1
    ? EASY_STORY_ENCOUNTERS[index + 1].id
    : null;
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

  const startStory = (encounterId: StoryEncounterId): StartSessionResult => {
    const config = createStoryGameSessionConfig(profile, encounterId);
    if (typeof config === 'string') return { ok: false, error: config };
    session = createGameSession(config);
    return { ok: true, session };
  };

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
    startStory,
    settleActiveSession() {
      if (!session || session.state.match.status === 'playing') {
        return { settled: false, storyCompleted: null, nextStoryEncounterId: null };
      }
      if (session.config.mode.kind !== 'story' || session.state.match.status !== 'victory') {
        return { settled: true, storyCompleted: null, nextStoryEncounterId: null };
      }

      const encounterId = session.config.mode.encounterId;
      const alreadyCompleted = profile.story.completedEncounterIds.includes(encounterId);
      if (!alreadyCompleted) {
        profile = storage.save(completeStoryEncounter(profile, encounterId));
      }
      return {
        settled: true,
        storyCompleted: encounterId,
        nextStoryEncounterId: nextEncounterId(encounterId),
      };
    },
    rematch() {
      if (!session) return { ok: false, error: 'no-active-session' };
      session = createGameSession(session.config);
      return { ok: true, session };
    },
    startNextStoryEncounter() {
      if (!session || session.config.mode.kind !== 'story') {
        return { ok: false, error: 'next-encounter-unavailable' };
      }
      const next = nextEncounterId(session.config.mode.encounterId);
      if (!next) return { ok: false, error: 'next-encounter-unavailable' };
      return startStory(next);
    },
    clearSession() {
      session = null;
      return snapshot();
    },
  };
}
