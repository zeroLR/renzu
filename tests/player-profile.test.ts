import { describe, expect, it } from 'vitest';
import { completeStoryEncounter, createPlayerProfile, grantSoul, normalizePlayerProfile, unlockHero } from '../src/progression/profile/player-profile';

describe('player profile', () => {
  it('starts local-first progression with Vanguard unlocked', () => {
    const profile = createPlayerProfile();
    expect(profile.unlockedHeroes).toEqual(['vanguard']);
    expect(profile.soul).toBe(0);
    expect(profile.skillFragments).toBe(0);
    expect(profile.story.completedEncounterIds).toEqual([]);
  });

  it('normalizes malformed progression without losing Vanguard', () => {
    const profile = normalizePlayerProfile({
      unlockedHeroes: ['shade', 'invalid'],
      soul: -20,
      skillFragments: 3,
      story: { completedEncounterIds: ['E1-1', 'bad'], lastEncounterId: 'bad' },
    });
    expect(profile.unlockedHeroes).toEqual(['vanguard', 'shade']);
    expect(profile.soul).toBe(0);
    expect(profile.story.completedEncounterIds).toEqual(['E1-1']);
    expect(profile.story.lastEncounterId).toBeNull();
  });

  it('updates unlock, Soul and story state immutably', () => {
    const initial = createPlayerProfile();
    const next = completeStoryEncounter(grantSoul(unlockHero(initial, 'arcanist'), 5), 'E1-1');
    expect(initial.unlockedHeroes).toEqual(['vanguard']);
    expect(next.unlockedHeroes).toContain('arcanist');
    expect(next.soul).toBe(5);
    expect(next.story.lastEncounterId).toBe('E1-1');
  });
});
