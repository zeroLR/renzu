import type { AbilityActivationRule } from '../economies/ability-economy';
import type { ResourceId } from '../economies/ability-state';

export type HeroId = 'vanguard' | 'arcanist' | 'shade';
export type PassiveId = 'fortified' | 'flow' | 'pressure';
export type HeroRole = 'defense' | 'control' | 'disruption';
export type HeroEngineKind = 'cooldown' | 'resource';
export type AbilityId = 'guard' | 'charge' | 'bulwark' | 'seal' | 'phase' | 'corrupt';

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
  defaultLoadout: readonly AbilityId[];
  activationOverrides: Partial<Record<AbilityId, AbilityActivationRule>>;
}

export const heroes: Record<HeroId, HeroDefinition> = {
  vanguard: {
    id: 'vanguard', role: 'defense', passive: 'fortified', economy: { kind: 'cooldown' },
    skillPool: ['guard', 'charge', 'bulwark'], defaultLoadout: ['guard', 'charge'],
    activationOverrides: { guard: { kind: 'cooldown', turns: 3 }, charge: { kind: 'cooldown', turns: 4 }, bulwark: { kind: 'cooldown', turns: 5 } },
  },
  arcanist: {
    id: 'arcanist', role: 'control', passive: 'flow', economy: { kind: 'resource', resourceId: 'mana', max: 5 },
    skillPool: ['seal', 'phase'], defaultLoadout: ['seal', 'phase'], activationOverrides: {},
  },
  shade: {
    id: 'shade', role: 'disruption', passive: 'pressure', economy: { kind: 'resource', resourceId: 'pressure', max: 3 },
    skillPool: ['corrupt'], defaultLoadout: ['corrupt'],
    activationOverrides: { corrupt: { kind: 'resource', resourceId: 'pressure', amount: 3 } },
  },
};

export const heroIds = Object.keys(heroes) as HeroId[];

export function isAbilityAccessible(heroId: HeroId, abilityId: AbilityId): boolean {
  return heroes[heroId].skillPool.includes(abilityId);
}

export function isLegalLoadout(heroId: HeroId, abilityIds: readonly AbilityId[]): boolean {
  return abilityIds.length >= 1
    && abilityIds.length <= 2
    && new Set(abilityIds).size === abilityIds.length
    && abilityIds.every((id) => isAbilityAccessible(heroId, id));
}
