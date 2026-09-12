import { describe, expect, it } from 'vitest';
import { aiDifficulty } from '../src/ai/difficulty/difficulty-profile';
import { resolveAiTurn } from '../src/app/game-session/cpu-turn';
import { createGameSession } from '../src/app/game-session/create-game-session';
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

  it('runs a complete directional 3 by 3 matrix', async () => {
    const result = await runBalanceSimulation(config({
      scope: 'matrix',
      gamesPerSeat: 1,
      maxActions: 1,
    }), { yieldControl: async () => undefined });

    expect(result.totalGames).toBe(9);
    expect(result.matchups).toHaveLength(9);
    expect(new Set(result.matchups.map((item) => `${item.p1Hero}>${item.p2Hero}`)).size).toBe(9);
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
