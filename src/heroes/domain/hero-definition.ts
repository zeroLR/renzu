import type { AbilityActivationRule } from '../economies/ability-economy';
import type { ResourceId } from '../economies/ability-state';

export type HeroId = 'vanguard' | 'arcanist' | 'shade';
export type PassiveId = 'fortified' | 'flow' | 'pressure';
export type HeroRole = 'defense' | 'control' | 'disruption';
export type HeroEngineKind = 'cooldown' | 'resource';
export type AbilityId = 'blink' | 'guard' | 'charge' | 'bulwark' | 'seal' | 'phase' | 'corrupt';

export interface HeroEconomyDefinition {
  kind: HeroEngineKind;
  resourceId?: ResourceId;
  max?: number;
}

export interface HeroDefinition {
  id: HeroId;
  role: HeroRole;
  passive: PassiveId;
  economy: HeroEconomyDefinition;
  skillPool: readonly AbilityId[];
  defaultLoadout: readonly [AbilityId, AbilityId];
  activationOverrides: Partial<Record<AbilityId, AbilityActivationRule>>;
}

export const heroes: Record<HeroId, HeroDefinition> = {
  vanguard: {
    id: 'vanguard', role: 'defense', passive: 'fortified', economy: { kind: 'cooldown' },
    skillPool: ['blink', 'guard', 'charge', 'bulwark'], defaultLoadout: ['blink', 'charge'],
    activationOverrides: { blink: { kind: 'cooldown', turns: 3 }, guard: { kind: 'cooldown', turns: 3 }, charge: { kind: 'cooldown', turns: 4 }, bulwark: { kind: 'cooldown', turns: 5 } },
  },
  arcanist: {
    id: 'arcanist', role: 'control', passive: 'flow', economy: { kind: 'resource', resourceId: 'mana', max: 5 },
    skillPool: ['blink', 'seal', 'phase'], defaultLoadout: ['blink', 'phase'], activationOverrides: {},
  },
  shade: {
    id: 'shade', role: 'disruption', passive: 'pressure', economy: { kind: 'resource', resourceId: 'pressure', max: 3 },
    skillPool: ['blink', 'corrupt'], defaultLoadout: ['blink', 'corrupt'],
    activationOverrides: { blink: { kind: 'resource', resourceId: 'pressure', amount: 2 }, corrupt: { kind: 'resource', resourceId: 'pressure', amount: 3 } },
  },
};

export const heroIds = Object.keys(heroes) as HeroId[];

export function isAbilityAccessible(heroId: HeroId, abilityId: AbilityId): boolean {
  return heroes[heroId].skillPool.includes(abilityId);
}

export function isLegalLoadout(heroId: HeroId, abilityIds: readonly AbilityId[]): boolean {
  return abilityIds.length === 2 && new Set(abilityIds).size === 2 && abilityIds.every((id) => isAbilityAccessible(heroId, id));
}
