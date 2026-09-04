import { describe, expect, it } from 'vitest';
import { createGameSession } from '../src/app/game-session/create-game-session';
import { createStoryGameSessionConfig, fromFreeBattleConfig } from '../src/app/game-session/game-session-config';
import { createFreeBattleSessionConfig } from '../src/modes/free-battle/free-battle-config';
import { completeStoryEncounter, createPlayerProfile } from '../src/progression/profile/player-profile';

describe('mode to game session integration', () => {
  it('maps a valid Free Battle config into the shared GameSessionConfig', () => {
    const profile = createPlayerProfile();
    const freeBattle = createFreeBattleSessionConfig(profile, {
      playerHeroId: 'vanguard',
      cpuHeroId: 'arcanist',
      cpuDifficulty: 'normal',
    });
    expect(freeBattle).not.toBe('hero-locked');
    if (freeBattle === 'hero-locked') return;

    expect(fromFreeBattleConfig(freeBattle)).toEqual({
      mode: { kind: 'free-battle' },
      playerHeroId: 'vanguard',
      cpuHeroId: 'arcanist',
      cpuDifficulty: 'normal',
    });
  });

  it('creates the first Story encounter config from a new profile', () => {
    const config = createStoryGameSessionConfig(createPlayerProfile(), 'E1-1');
    expect(config).toEqual({
      mode: { kind: 'story', encounterId: 'E1-1' },
      playerHeroId: 'vanguard',
      cpuHeroId: 'vanguard',
      cpuDifficulty: 'easy',
    });
  });

  it('rejects locked Story encounters until progression unlocks them', () => {
    let profile = createPlayerProfile();
    expect(createStoryGameSessionConfig(profile, 'E1-2')).toBe('encounter-locked');

    profile = completeStoryEncounter(profile, 'E1-1');
    expect(createStoryGameSessionConfig(profile, 'E1-2')).toMatchObject({
      mode: { kind: 'story', encounterId: 'E1-2' },
      cpuDifficulty: 'easy',
    });
  });

  it('bootstraps Story and Free Battle through the same session state contract', () => {
    const story = createStoryGameSessionConfig(createPlayerProfile(), 'E1-1');
    expect(typeof story).toBe('object');
    if (typeof story === 'string') return;

    const session = createGameSession(story);
    expect(session.config.mode).toEqual({ kind: 'story', encounterId: 'E1-1' });
    expect(session.state.match).toMatchObject({ turn: 1, phase: 'player', status: 'playing' });
    expect(session.state.boardEffects).toEqual([]);
    expect(session.state.timing?.pendingFollowUp).toBeNull();
  });

  it('preserves the Story boss Normal difficulty through session bootstrap', () => {
    let profile = createPlayerProfile();
    for (const id of ['E1-1', 'E1-2', 'E1-3', 'E1-4', 'E1-5'] as const) {
      profile = completeStoryEncounter(profile, id);
    }
    const boss = createStoryGameSessionConfig(profile, 'E1-BOSS');
    expect(typeof boss).toBe('object');
    if (typeof boss === 'string') return;

    const session = createGameSession(boss);
    expect(session.config.cpuDifficulty).toBe('normal');
    expect(session.config.mode).toEqual({ kind: 'story', encounterId: 'E1-BOSS' });
  });
});
