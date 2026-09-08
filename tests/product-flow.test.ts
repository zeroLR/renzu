import { describe, expect, it } from 'vitest';
import { createProductFlow } from '../src/app/game-session/product-flow';
import { heroIds } from '../src/heroes/domain/hero-definition';
import type { PlayerProfileStorage } from '../src/platform/storage/player-profile-storage';
import { createPlayerProfile, unlockHero } from '../src/progression/profile/player-profile';

function storage(profile = createPlayerProfile()): PlayerProfileStorage {
  let current = profile;
  return {
    load: () => current,
    save: (next) => (current = next),
    clear: () => (current = createPlayerProfile()),
  };
}

describe('product flow', () => {
  it('starts free battle through the shared session contract', () => {
    const flow = createProductFlow(storage());
    flow.selectDifficulty('easy');
    const result = flow.startFreeBattle();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session.config).toMatchObject({ mode: { kind: 'free-battle' }, playerHeroId: 'vanguard', cpuDifficulty: 'easy' });
  });

  it('rejects a locked player hero before session creation', () => {
    const flow = createProductFlow(storage());
    flow.selectPlayerHero('arcanist');
    expect(flow.startFreeBattle()).toEqual({ ok: false, error: 'hero-locked' });
    expect(flow.snapshot().session).toBeNull();
  });

  it('starts only unlocked story encounters', () => {
    const flow = createProductFlow(storage());
    expect(flow.startStory('E1-2')).toEqual({ ok: false, error: 'encounter-locked' });
    const first = flow.startStory('E1-1');
    expect(first.ok).toBe(true);
  });

  it('allows unlocked heroes to be selected for free battle', () => {
    const profile = unlockHero(createPlayerProfile(), 'arcanist');
    const flow = createProductFlow(storage(profile));
    flow.selectPlayerHero('arcanist');
    const result = flow.startFreeBattle();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.session.config.playerHeroId).toBe('arcanist');
  });

  it('exposes every hero for validation without mutating profile ownership', () => {
    const profileStorage = storage();
    const flow = createProductFlow(profileStorage, { allowLockedFreeBattleHeroes: true });

    expect(flow.snapshot().freeBattleAccess).toEqual({
      playerHeroIds: heroIds,
      validationOverride: true,
    });

    for (const heroId of heroIds) {
      flow.selectPlayerHero(heroId);
      const result = flow.startFreeBattle();
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.session.config.playerHeroId).toBe(heroId);
      flow.clearSession();
    }

    expect(flow.snapshot().profile.unlockedHeroes).toEqual(['vanguard']);
  });
});
