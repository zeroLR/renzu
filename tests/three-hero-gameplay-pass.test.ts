import { describe, expect, it } from 'vitest';
import { heroPresentation } from '../src/heroes/content/hero-presentation';
import { heroIds, heroes, isLegalLoadout } from '../src/heroes/domain/hero-definition';

describe('R3.1 three-hero gameplay pass', () => {
  it('keeps the active v1 roster fixed at three hero engines', () => {
    expect(heroIds).toEqual(['vanguard', 'arcanist', 'shade']);
    expect(new Set(heroIds.map((id) => heroes[id].passive)).size).toBe(3);
  });

  it('gives every hero a legal default loadout and player-facing battle plan', () => {
    for (const heroId of heroIds) {
      expect(isLegalLoadout(heroId, heroes[heroId].defaultLoadout)).toBe(true);
      expect(heroPresentation[heroId].displayName.length).toBeGreaterThan(0);
      expect(heroPresentation[heroId].engineLabel.length).toBeGreaterThan(0);
      expect(heroPresentation[heroId].battlePlan.length).toBeGreaterThan(0);
    }
  });

  it('keeps the three battle-plan summaries distinct on one fixed turn topology', () => {
    expect(new Set(heroIds.map((id) => heroPresentation[id].battlePlan)).size).toBe(heroIds.length);
  });
});
