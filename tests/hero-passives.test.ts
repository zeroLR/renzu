import { describe, expect, it } from 'vitest';
import { createBoard } from '../src/game/board/board';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { getAbilityResource, setAbilityResource } from '../src/heroes/economies/ability-economy';
import { heroes, isLegalLoadout } from '../src/heroes/domain/hero-definition';
import { applyAfterAbilityPassive, applyAfterPlacePassive } from '../src/heroes/domain/passive-engine';

describe('hero definitions', () => {
  it('maps each hero to its distinct economy engine', () => {
    expect(heroes.vanguard.economy.kind).toBe('cooldown');
    expect(heroes.arcanist.economy.resourceId).toBe('mana');
    expect(heroes.shade.economy.resourceId).toBe('pressure');
    expect(heroes.architect.economy.kind).toBe('conditional');
    expect(heroes.swordmaster.economy.resourceId).toBe('momentum');
  });

  it('keeps loadouts within the hero skill pool', () => {
    expect(isLegalLoadout('vanguard', ['blink', 'charge'])).toBe(true);
    expect(isLegalLoadout('vanguard', ['corrupt', 'charge'])).toBe(false);
  });
});

describe('hero passive engine', () => {
  it('gives Shade pressure when placing adjacent to an enemy', () => {
    const board = createBoard();
    board[4][4] = 1;
    board[4][5] = 2;
    const result = applyAfterPlacePassive(createAbilityStates(), 'shade', {
      board, actor: 1, at: { row: 4, col: 4 }, patternReward: 0,
    });
    expect(result.triggered).toBe(true);
    expect(getAbilityResource(result.states, 1, 'pressure')).toBe(1);
  });

  it('marks Architect formation ready with two adjacent allies', () => {
    const board = createBoard();
    board[4][4] = 1;
    board[4][3] = 1;
    board[3][4] = 1;
    const result = applyAfterPlacePassive(createAbilityStates(), 'architect', {
      board, actor: 1, at: { row: 4, col: 4 }, patternReward: 0,
    });
    expect(result.triggered).toBe(true);
    expect(result.states[1].conditions['formation-ready']).toBe(true);
  });

  it('caps Swordmaster momentum at three', () => {
    const states = setAbilityResource(createAbilityStates(), 1, 'momentum', 2);
    const result = applyAfterPlacePassive(states, 'swordmaster', {
      board: createBoard(), actor: 1, at: { row: 4, col: 4 }, patternReward: 2,
    });
    expect(getAbilityResource(result.states, 1, 'momentum')).toBe(3);
  });

  it('refunds one Mana for Arcanist after an ability', () => {
    const states = setAbilityResource(createAbilityStates(), 1, 'mana', 3);
    const result = applyAfterAbilityPassive(states, 'arcanist', 1);
    expect(getAbilityResource(result.states, 1, 'mana')).toBe(4);
  });

  it('emits Vanguard guard as an outcome instead of mutating board state', () => {
    const result = applyAfterPlacePassive(createAbilityStates(), 'vanguard', {
      board: createBoard(), actor: 1, at: { row: 2, col: 2 }, patternReward: 1,
    });
    expect(result.boardEffect).toBe('guard');
  });
});
