import { aiDifficulty, type AiDifficultyProfile } from '../../ai/difficulty/difficulty-profile';
import type { GameSession } from '../../app/game-session/create-game-session';
import type { HeroId } from '../../heroes/domain/hero-definition';
import {
  createSeededRandom,
  createTakeoverSession,
  replayBalanceMatch,
  runBalanceSimulation,
  type BalanceLabConfig,
  type BalanceProgress,
  type BalanceReplay,
  type BalanceRunResult,
  type BalanceScope,
} from './balance-simulation';

export type BalanceResultsTab = 'overview' | 'matchups' | 'anomalies';
export type TunableProfileKey = Exclude<keyof AiDifficultyProfile, 'id'>;

export interface BalanceLabSnapshot {
  config: BalanceLabConfig;
  running: boolean;
  progress: BalanceProgress | null;
  result: BalanceRunResult | null;
  resultsTab: BalanceResultsTab;
  replay: BalanceReplay | null;
  replayStep: number;
  takeoverSession: GameSession | null;
}

export interface BalanceLabController {
  snapshot(): BalanceLabSnapshot;
  setScope(scope: BalanceScope): void;
  setHeroA(heroId: HeroId): void;
  setHeroB(heroId: HeroId): void;
  setSwapSeats(enabled: boolean): void;
  adjustGames(delta: number): void;
  adjustSeed(delta: number): void;
  adjustMaxActions(delta: number): void;
  adjustProfile(key: TunableProfileKey, delta: number): void;
  resetProfile(): void;
  run(onChange?: () => void): Promise<BalanceRunResult | null>;
  setResultsTab(tab: BalanceResultsTab): void;
  inspectMatch(matchId: number): boolean;
  moveReplayStep(delta: number): void;
  setReplayStep(step: number): void;
  createTakeover(): boolean;
  clearTakeover(): void;
}

const PROFILE_LIMITS: Record<TunableProfileKey, { min: number; max: number; integer?: boolean }> = {
  candidateWidth: { min: 1, max: 16, integer: true },
  attackWeight: { min: 0.25, max: 2 },
  defenseWeight: { min: 0.25, max: 2 },
  abilityWeight: { min: 0, max: 2 },
  optimalMoveRate: { min: 0, max: 1 },
  blunderTolerance: { min: 0, max: 0.5 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function defaultConfig(): BalanceLabConfig {
  return {
    scope: 'pair',
    heroA: 'vanguard',
    heroB: 'arcanist',
    gamesPerSeat: 50,
    swapSeats: true,
    seed: 1337,
    maxActions: 120,
    profile: { ...aiDifficulty('normal') },
  };
}

function cloneConfig(config: BalanceLabConfig): BalanceLabConfig {
  return { ...config, profile: { ...config.profile } };
}

export function createBalanceLabController(): BalanceLabController {
  let config = defaultConfig();
  let running = false;
  let progress: BalanceProgress | null = null;
  let result: BalanceRunResult | null = null;
  let resultsTab: BalanceResultsTab = 'overview';
  let replay: BalanceReplay | null = null;
  let replayStep = 0;
  let takeoverSession: GameSession | null = null;

  const snapshot = (): BalanceLabSnapshot => ({
    config: cloneConfig(config),
    running,
    progress: progress ? { ...progress } : null,
    result,
    resultsTab,
    replay,
    replayStep,
    takeoverSession,
  });

  const nearestPlayerStep = (): number | null => {
    if (!replay) return null;
    for (let offset = 0; offset < replay.snapshots.length; offset += 1) {
      const forward = replayStep + offset;
      if (forward < replay.snapshots.length) {
        const state = replay.snapshots[forward];
        if (state.match.status === 'playing' && state.match.phase === 'player') return forward;
      }
      const backward = replayStep - offset;
      if (backward >= 0) {
        const state = replay.snapshots[backward];
        if (state.match.status === 'playing' && state.match.phase === 'player') return backward;
      }
    }
    return null;
  };

  return {
    snapshot,
    setScope(scope) {
      if (running) return;
      config = { ...config, scope };
    },
    setHeroA(heroId) {
      if (running) return;
      config = { ...config, heroA: heroId };
    },
    setHeroB(heroId) {
      if (running) return;
      config = { ...config, heroB: heroId };
    },
    setSwapSeats(enabled) {
      if (running) return;
      config = { ...config, swapSeats: enabled };
    },
    adjustGames(delta) {
      if (running) return;
      config = { ...config, gamesPerSeat: Math.round(clamp(config.gamesPerSeat + delta, 5, 500)) };
    },
    adjustSeed(delta) {
      if (running) return;
      config = { ...config, seed: Math.max(0, Math.round(config.seed + delta)) };
    },
    adjustMaxActions(delta) {
      if (running) return;
      config = { ...config, maxActions: Math.round(clamp(config.maxActions + delta, 40, 240)) };
    },
    adjustProfile(key, delta) {
      if (running) return;
      const limits = PROFILE_LIMITS[key];
      let value = clamp(Number(config.profile[key]) + delta, limits.min, limits.max);
      value = limits.integer ? Math.round(value) : rounded(value);
      config = { ...config, profile: { ...config.profile, [key]: value } };
    },
    resetProfile() {
      if (running) return;
      config = { ...config, profile: { ...aiDifficulty('normal') } };
    },
    async run(onChange) {
      if (running) return null;
      running = true;
      progress = null;
      result = null;
      replay = null;
      takeoverSession = null;
      resultsTab = 'overview';
      onChange?.();
      try {
        const next = await runBalanceSimulation(cloneConfig(config), {
          onProgress(nextProgress) {
            progress = nextProgress;
            onChange?.();
          },
        });
        result = next;
        progress = { completed: next.totalGames, total: next.totalGames };
        return next;
      } finally {
        running = false;
        onChange?.();
      }
    },
    setResultsTab(tab) {
      resultsTab = tab;
    },
    inspectMatch(matchId) {
      if (!result) return false;
      replay = replayBalanceMatch(result, matchId);
      replayStep = replay ? Math.max(0, replay.snapshots.length - 1) : 0;
      takeoverSession = null;
      return replay !== null;
    },
    moveReplayStep(delta) {
      if (!replay) return;
      replayStep = Math.round(clamp(replayStep + delta, 0, replay.snapshots.length - 1));
    },
    setReplayStep(step) {
      if (!replay) return;
      replayStep = Math.round(clamp(step, 0, replay.snapshots.length - 1));
    },
    createTakeover() {
      if (!replay || !result) return false;
      const step = nearestPlayerStep();
      if (step === null) return false;
      replayStep = step;
      takeoverSession = createTakeoverSession(replay, step);
      return takeoverSession !== null;
    },
    clearTakeover() {
      takeoverSession = null;
    },
  };
}

export function takeoverCpuProfile(snapshot: BalanceLabSnapshot): AiDifficultyProfile | null {
  return snapshot.result ? { ...snapshot.result.config.profile } : null;
}

export function takeoverRandom(snapshot: BalanceLabSnapshot): (() => number) | undefined {
  if (!snapshot.replay) return undefined;
  return createSeededRandom(snapshot.replay.match.seed + snapshot.replayStep * 104729);
}
