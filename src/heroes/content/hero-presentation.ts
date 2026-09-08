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
    battlePlan: 'FORTIFY PATTERNS, THEN REPOSITION OR PUSH.',
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
  architect: {
    displayName: 'ARCHITECT',
    engineLabel: 'FORMATION · CONTROL',
    battlePlan: 'BUILD SUPPORT NETWORKS, THEN MOVE OR SEAL SPACE.',
  },
  swordmaster: {
    displayName: 'SWORDMASTER',
    engineLabel: 'MOMENTUM · OFFENSE',
    battlePlan: 'CREATE PATTERNS, KEEP TEMPO, THEN STEP INTO SEVER.',
  },
};
