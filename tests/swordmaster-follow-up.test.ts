import { describe, expect, it } from 'vitest';
import { resolveSessionAction } from '../src/game/action/action-session';
import { listLegalActions } from '../src/game/action/legal-action';
import type { AbilityActionState } from '../src/game/action/ability-action';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { getAbilityResource, setAbilityCharge, setAbilityResource } from '../src/heroes/economies/ability-economy';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

function severSetup(): AbilityActionState {
  let state = createState();
  state = {
    ...state,
    abilities: setAbilityCharge(setAbilityResource(state.abilities, 1, 'momentum', 3), 1, 'step', 1),
  };
  state.match.board[4][2] = 1;
  state.match.board[4][3] = 1;
  state.match.board[5][4] = 2;
  return state;
}

function armStep(state: AbilityActionState): AbilityActionState {
  const armed = resolveSessionAction(state, {
    kind: 'ability', actor: 1, heroId: 'swordmaster', abilityId: 'step', target: { row: 0, col: 0 },
  }, 'swordmaster');
  expect(armed.ok).toBe(true);
  if (!armed.ok) throw new Error('Step should arm');
  return armed.state;
}

function placeWithStepForSever(): AbilityActionState {
  const armed = armStep(severSetup());
  const placement = listLegalActions(armed, 'swordmaster', 1).find((action) =>
    action.kind === 'follow-up'
    && action.action.kind === 'place'
    && action.action.at.row === 4
    && action.action.at.col === 4,
  );
  expect(placement).toBeDefined();
  if (!placement) throw new Error('Step placement should be legal');

  const placed = resolveSessionAction(armed, placement, 'swordmaster');
  expect(placed.ok).toBe(true);
  if (!placed.ok) throw new Error('Step placement should resolve');
  return placed.state;
}

describe('Swordmaster follow-up lifecycle', () => {
  it('Step keeps its charge while armed, then consumes it to preserve Momentum on a quiet placement', () => {
    let state = createState();
    state = {
      ...state,
      abilities: setAbilityCharge(setAbilityResource(state.abilities, 1, 'momentum', 2), 1, 'step', 1),
    };

    const armed = resolveSessionAction(state, {
      kind: 'ability', actor: 1, heroId: 'swordmaster', abilityId: 'step', target: { row: 0, col: 0 },
    }, 'swordmaster');
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.consumedTurn).toBe(false);
    expect(armed.state.abilities[1].charges.step).toBe(1);

    const placement = listLegalActions(armed.state, 'swordmaster', 1).find((action) =>
      action.kind === 'follow-up'
      && action.action.kind === 'place'
      && action.action.at.row === 0
      && action.action.at.col === 0,
    );
    expect(placement).toBeDefined();
    if (!placement) return;

    const placed = resolveSessionAction(armed.state, placement, 'swordmaster');
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(getAbilityResource(placed.state.abilities, 1, 'momentum')).toBe(2);
    expect(placed.state.abilities[1].charges.step).toBe(0);
    expect(placed.state.match.board[0][0]).toBe(1);
    expect(placed.state.match.phase).toBe('opponent');
  });

  it('does not open Sever after an unprotected quiet placement that decays Momentum', () => {
    let state = createState();
    state = { ...state, abilities: setAbilityResource(state.abilities, 1, 'momentum', 3) };
    state.match.board[5][4] = 2;

    const placed = resolveSessionAction(state, { kind: 'place', actor: 1, at: { row: 4, col: 4 } }, 'swordmaster');

    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(placed.consumedTurn).toBe(true);
    expect(getAbilityResource(placed.state.abilities, 1, 'momentum')).toBe(2);
    expect(placed.state.match.phase).toBe('opponent');
    expect(placed.state.timing?.pendingFollowUp).toBeNull();
  });

  it('opens Sever and refreshes Step after a protected placement creates a pattern', () => {
    const state = placeWithStepForSever();

    expect(state.match.phase).toBe('player');
    expect(state.timing?.pendingFollowUp).toEqual({ actor: 1, abilityId: 'sever', kind: 'triggered' });
    expect(getAbilityResource(state.abilities, 1, 'momentum')).toBe(3);
    expect(state.abilities[1].charges.step).toBe(1);

    const legal = listLegalActions(state, 'swordmaster', 1);
    expect(legal.some((action) => action.kind === 'end-follow-up')).toBe(true);
    expect(legal.some((action) =>
      action.kind === 'follow-up'
      && action.action.kind === 'ability'
      && action.action.abilityId === 'sever',
    )).toBe(true);
  });

  it('resolves triggered Sever inside the same logical turn', () => {
    const state = placeWithStepForSever();

    const sever = listLegalActions(state, 'swordmaster', 1).find((action) =>
      action.kind === 'follow-up'
      && action.action.kind === 'ability'
      && action.action.abilityId === 'sever'
      && action.action.source?.row === 4
      && action.action.source.col === 4
      && action.action.target.row === 5
      && action.action.target.col === 4,
    );
    expect(sever).toBeDefined();
    if (!sever) return;

    const result = resolveSessionAction(state, sever, 'swordmaster');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.consumedTurn).toBe(true);
    expect(result.state.match.board[5][4]).toBe(0);
    expect(result.state.match.board[6][4]).toBe(2);
    expect(result.state.match.phase).toBe('opponent');
    expect(result.state.timing?.pendingFollowUp).toBeNull();
    expect(getAbilityResource(result.state.abilities, 1, 'momentum')).toBe(0);
  });

  it('allows the triggered Sever window to be skipped explicitly', () => {
    const state = placeWithStepForSever();

    const end = listLegalActions(state, 'swordmaster', 1).find((action) => action.kind === 'end-follow-up');
    expect(end).toBeDefined();
    if (!end) return;

    const result = resolveSessionAction(state, end, 'swordmaster');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.consumedTurn).toBe(true);
    expect(result.state.match.phase).toBe('opponent');
    expect(result.state.timing?.pendingFollowUp).toBeNull();
    expect(getAbilityResource(result.state.abilities, 1, 'momentum')).toBe(3);
  });
});
