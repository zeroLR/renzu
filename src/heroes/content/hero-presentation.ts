import type { HeroId } from '../domain/hero-definition';

export interface HeroPresentationProfile {
  displayName: string;
  engineLabel: string;
  battlePlan: string;
}

export const heroPresentation: Record<HeroId, HeroPresentationProfile> = {
  vanguard: {
    displayName: 'VANGUARD',
    engineLabel: 'COOLDOWN · DEFENSE',
    battlePlan: 'FORTIFY PATTERNS, THEN CONVERT POSITION WITH GUARD OR CHARGE.',
  },
  arcanist: {
    displayName: 'ARCANIST',
    engineLabel: 'MANA · CONTROL',
    battlePlan: 'BUILD PATTERNS TO FUND CONTROL AND PHASE PLAYS.',
  },
  shade: {
    displayName: 'SHADE',
    engineLabel: 'PRESSURE · DISRUPTION',
    battlePlan: 'PLAY CLOSE, BUILD PRESSURE, THEN BREAK KEY STONES.',
  },
};
