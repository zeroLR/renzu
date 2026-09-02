import { describe, expect, it } from 'vitest';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import {
  advanceAbilityEconomyAfterTurn,
  canActivate,
  consumeActivation,
  getAbilityCooldown,
  getAbilityResource,
  getAbilityUsesSpent,
  setAbilityCondition,
  setAbilityResource,
} from '../src/heroes/economies/ability-economy';

describe('hero ability economy', () => {
  it('supports resource readiness and consumption without mutating the previous state', () => {
    const initial = createAbilityStates();
    const funded = setAbilityResource(initial, 1, 'mana', 3);
    const rule = { kind: 'resource', resourceId: 'mana', amount: 2 } as const;

    expect(canActivate(funded, 1, rule)).toEqual({ ready: true });

    const consumed = consumeActivation(funded, 1, rule);
    expect(getAbilityResource(consumed, 1, 'mana')).toBe(1);
    expect(getAbilityResource(funded, 1, 'mana')).toBe(3);
  });

  it('supports condition-gated resources for pressure-style hero engines', () => {
    const initial = setAbilityResource(createAbilityStates(), 1, 'pressure', 2);
    const rule = {
      kind: 'resource-and-condition',
      resourceId: 'pressure',
      amount: 2,
      conditionId: 'contested-space',
    } as const;

    expect(canActivate(initial, 1, rule)).toEqual({ ready: false, reason: 'condition' });

    const enabled = setAbilityCondition(initial, 1, 'contested-space', true);
    expect(canActivate(enabled, 1, rule)).toEqual({ ready: true });
  });

  it('starts cooldown on activation and advances only the actor whose turn ended', () => {
    const initial = createAbilityStates();
    const rule = { kind: 'cooldown', turns: 2 } as const;
    const activated = consumeActivation(initial, 1, rule, 'guard');

    expect(getAbilityCooldown(activated, 1, 'guard')).toBe(2);
    expect(canActivate(activated, 1, rule, 'guard')).toEqual({ ready: false, reason: 'cooldown' });

    const afterOpponentTurn = advanceAbilityEconomyAfterTurn(activated, 2);
    expect(getAbilityCooldown(afterOpponentTurn, 1, 'guard')).toBe(2);

    const afterOwnerTurn = advanceAbilityEconomyAfterTurn(afterOpponentTurn, 1);
    expect(getAbilityCooldown(afterOwnerTurn, 1, 'guard')).toBe(1);
  });

  it('tracks limited-use abilities independently per actor', () => {
    const initial = createAbilityStates();
    const rule = { kind: 'limited-use', uses: 1 } as const;
    const spent = consumeActivation(initial, 1, rule, 'finisher');

    expect(getAbilityUsesSpent(spent, 1, 'finisher')).toBe(1);
    expect(getAbilityUsesSpent(spent, 2, 'finisher')).toBe(0);
    expect(canActivate(spent, 1, rule, 'finisher')).toEqual({ ready: false, reason: 'limited-use' });
    expect(canActivate(spent, 2, rule, 'finisher')).toEqual({ ready: true });
  });

  it('clamps resources at zero', () => {
    const state = setAbilityResource(createAbilityStates(), 1, 'momentum', -5);
    expect(getAbilityResource(state, 1, 'momentum')).toBe(0);
  });
});
