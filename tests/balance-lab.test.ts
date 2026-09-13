import { describe, expect, it } from 'vitest';
import { aiDifficulty } from '../src/ai/difficulty/difficulty-profile';
import { resolveAiTurn } from '../src/app/game-session/cpu-turn';
import { createGameSession } from '../src/app/game-session/create-game-session';
import { analyzeBalanceResult } from '../src/debug/balance/balance-analysis';
import { diagnoseBalanceMatch } from '../src/debug/balance/balance-diagnostics';
import { runChargeTacticalBenchmark } from '../src/debug/balance/charge-benchmark';
import {
  createTakeoverSession,
  replayBalanceMatch,
  runBalanceSimulation,
  type BalanceLabConfig,
} from '../src/debug/balance/balance-simulation';
import { debugToolsEnabled } from '../src/platform/environment/runtime-environment';

function config(overrides: Partial<BalanceLabConfig> = {}): BalanceLabConfig {
  return {
    scope: 'pair',
    heroA: 'vanguard',
    heroB: 'arcanist',
    gamesPerSeat: 1,
    swapSeats: true,
    seed: 4242,
    maxActions: 6,
    profile: { ...aiDifficulty('normal') },
    ...overrides,
  };
}

describe('debug balance lab', () => {
  it('only enables debug tools for debug=1', () => {
    expect(debugToolsEnabled('?debug=1')).toBe(true);
    expect(debugToolsEnabled('?debug=0')).toBe(false);
    expect(debugToolsEnabled('?foo=1')).toBe(false);
  });

  it('uses the shared AI turn resolver for both seats', () => {
    const session = createGameSession({
      mode: { kind: 'free-battle' },
      playerHeroId: 'vanguard',
      cpuHeroId: 'arcanist',
      cpuDifficulty: 'normal',
    });
    const profile = aiDifficulty('normal');
    const p1 = resolveAiTurn(session.state, 1, { heroId: 'vanguard', profile, random: () => 0 });
    expect(p1.ok).toBe(true);
    if (!p1.ok) return;
    expect(p1.state.match.phase).toBe('opponent');

    const p2 = resolveAiTurn(p1.state, 2, { heroId: 'arcanist', profile, random: () => 0 });
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(p2.state.match.phase).toBe('player');
  });

  it('is deterministic and preserves seat-swapped pair scheduling', async () => {
    const first = await runBalanceSimulation(config(), { yieldControl: async () => undefined });
    const second = await runBalanceSimulation(config(), { yieldControl: async () => undefined });

    expect(first.totalGames).toBe(2);
    expect(first.matchups).toHaveLength(2);
    expect(first.matches).toEqual(second.matches);
    expect(first.abilityUses).toEqual(second.abilityUses);
    expect(first.patternEvents).toEqual(second.patternEvents);
  });

  it('runs a complete directional 3 by 3 matrix and exposes health analysis', async () => {
    const result = await runBalanceSimulation(config({
      scope: 'matrix',
      gamesPerSeat: 1,
      maxActions: 1,
    }), { yieldControl: async () => undefined });
    const analysis = analyzeBalanceResult(result);

    expect(result.totalGames).toBe(9);
    expect(result.matchups).toHaveLength(9);
    expect(new Set(result.matchups.map((item) => `${item.p1Hero}>${item.p2Hero}`)).size).toBe(9);
    expect(analysis.pairs).toHaveLength(3);
    expect(analysis.mirrors).toHaveLength(3);
    expect(analysis.validity.totalGames).toBe(9);
    expect(analysis.validity.validGames + analysis.validity.errors + analysis.validity.stalled).toBe(9);
    expect(analysis.validity.placementRate).toBeGreaterThanOrEqual(0);
    expect(analysis.validity.placementRate).toBeLessThanOrEqual(1);
  });

  it('keeps the observed arcanist mirror anomaly seeds playable after the denial runway guardrail', () => {
    const matchIds = [204, 206, 223, 227, 230, 240, 250];
    const diagnostics = matchIds.map((matchId) => {
      const gameIndex = matchId - 201;
      return diagnoseBalanceMatch({
        p1Hero: 'arcanist',
        p2Hero: 'arcanist',
        seed: 1337 + gameIndex * 9973,
        maxActions: 120,
      });
    });

    expect(diagnostics.every((result) => result.completed && result.failure === null)).toBe(true);
  });

  it('benchmarks Vanguard Charge as an immediate-win tactical finisher', () => {
    const benchmark = runChargeTacticalBenchmark(aiDifficulty('normal'), 7001);

    expect(benchmark.total).toBe(12);
    expect(benchmark.chargeSelections).toBe(12);
    expect(benchmark.immediateWins).toBe(12);
    expect(benchmark.chargeSelectionRate).toBe(1);
    expect(benchmark.immediateWinRate).toBe(1);
  });

  it('can replay a flagged match and create a playable P1 takeover snapshot', async () => {
    const result = await runBalanceSimulation(config({ maxActions: 4, swapSeats: false }), {
      yieldControl: async () => undefined,
    });
    const match = result.matches[0];
    expect(match.flags).toContain('STALLED');

    const replay = replayBalanceMatch(result, match.id);
    expect(replay).not.toBeNull();
    if (!replay) return;
    expect(replay.snapshots.length).toBe(replay.actions.length + 1);

    const playerStep = replay.snapshots.findIndex((state, index) =>
      index > 0 && state.match.status === 'playing' && state.match.phase === 'player',
    );
    expect(playerStep).toBeGreaterThan(0);
    const takeover = createTakeoverSession(replay, playerStep);
    expect(takeover).not.toBeNull();
    expect(takeover?.state.match.phase).toBe('player');
    expect(takeover?.config.playerHeroId).toBe(match.p1Hero);
    expect(takeover?.config.cpuHeroId).toBe(match.p2Hero);
  });
});