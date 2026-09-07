import { describe, expect, it } from 'vitest';
import { createBattleController } from '../src/app/game-session/battle-controller';
import { createGameSession } from '../src/app/game-session/create-game-session';
import { resolveCpuTurn } from '../src/app/game-session/cpu-turn';
import { createActionTimingState } from '../src/game/action/action-timing';
import { resolveSessionAction } from '../src/game/action/action-session';
import type { AbilityActionState } from '../src/game/action/ability-action';
import { listLegalActions } from '../src/game/action/legal-action';
import { createMatchState } from '../src/game/match/match-state';
import {
  getAbilityCharge,
  getAbilityResource,
  setAbilityCharge,
  setAbilityResource,
} from '../src/heroes/economies/ability-economy';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import type { HeroId } from '../src/heroes/domain/hero-definition';

function state(): AbilityActionState {
  return {
    match: createMatchState(),
    abilities: createAbilityStates(),
    boardEffects: [],
    timing: createActionTimingState(),
  };
}

function freeBattle(playerHeroId: HeroId, cpuHeroId: HeroId = 'vanguard') {
  return createGameSession({
    mode: { kind: 'free-battle' },
    playerHeroId,
    cpuHeroId,
    cpuDifficulty: 'easy',
  });
}

describe('R2.4 combat characterization gate', () => {
  it('Vanguard pattern guard survives handoff and expires after the CPU logical turn', async () => {
    const session = freeBattle('vanguard');
    session.state.match.board[4][2] = 1;
    session.state.match.board[4][3] = 1;
    const controller = createBattleController(session, () => 0);

    controller.tapCell({ row: 4, col: 4 });

    expect(session.state.match.phase).toBe('opponent');
    expect(session.state.boardEffects).toContainEqual({
      kind: 'guard',
      at: { row: 4, col: 4 },
      owner: 1,
      expiry: { kind: 'opponent-turns', remaining: 1 },
    });

    await controller.advanceCpuTurn(undefined, {
      thinkDelayMs: 0,
      followUpDelayMs: 0,
      delay: async () => {},
    });

    expect(session.state.match.phase).toBe('player');
    expect(session.state.boardEffects.some((effect) => effect.kind === 'guard' && effect.at.row === 4 && effect.at.col === 4)).toBe(false);
  });

  it('Arcanist converts a pattern reward into a real Phase activation lifecycle', () => {
    const initial = state();
    initial.match.board[4][2] = 1;
    initial.match.board[4][3] = 1;
    initial.abilities = setAbilityResource(initial.abilities, 1, 'mana', 2);

    const placed = resolveSessionAction(
      initial,
      { kind: 'place', actor: 1, at: { row: 4, col: 4 } },
      'arcanist',
    );
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(getAbilityResource(placed.state.abilities, 1, 'mana')).toBe(3);

    const cpu = resolveCpuTurn(placed.state, { heroId: 'vanguard', difficulty: 'easy', random: () => 0 });
    expect(cpu.ok).toBe(true);
    if (!cpu.ok) return;

    const phase = listLegalActions(cpu.state, 'arcanist', 1).find(
      (action) => action.kind === 'ability' && action.abilityId === 'phase',
    );
    expect(phase).toBeDefined();
    if (!phase) return;

    const resolved = resolveSessionAction(cpu.state, phase, 'arcanist');
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(getAbilityResource(resolved.state.abilities, 1, 'mana')).toBe(1);
    expect(resolved.state.match.phase).toBe('opponent');
  });

  it('Shade legal Corrupt consumes Pressure and removes the supported enemy stone', () => {
    const initial = state();
    initial.match.board[4][4] = 1;
    initial.match.board[4][5] = 2;
    initial.abilities = setAbilityResource(initial.abilities, 1, 'pressure', 3);

    const corrupt = listLegalActions(initial, 'shade', 1).find(
      (action) => action.kind === 'ability'
        && action.abilityId === 'corrupt'
        && action.target.row === 4
        && action.target.col === 5,
    );
    expect(corrupt).toBeDefined();
    if (!corrupt) return;

    const resolved = resolveSessionAction(initial, corrupt, 'shade');
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.state.match.board[4][5]).toBe(0);
    expect(getAbilityResource(resolved.state.abilities, 1, 'pressure')).toBe(0);
    expect(resolved.state.match.phase).toBe('opponent');
  });

  it('Architect condition readiness, legal targeting, and Rally resolution stay on one shared contract', () => {
    const initial = state();
    initial.match.board[0][0] = 1;
    initial.match.board[3][3] = 1;
    initial.match.board[3][5] = 1;

    const rally = listLegalActions(initial, 'architect', 1).find(
      (action) => action.kind === 'ability'
        && action.abilityId === 'rally'
        && action.source?.row === 0
        && action.source?.col === 0
        && action.target.row === 4
        && action.target.col === 4,
    );
    expect(rally).toBeDefined();
    if (!rally) return;

    const resolved = resolveSessionAction(initial, rally, 'architect');
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.state.match.board[0][0]).toBe(0);
    expect(resolved.state.match.board[4][4]).toBe(1);
    expect(resolved.state.abilities[1].conditions['rally-ready']).toBe(true);
    expect(resolved.state.match.phase).toBe('opponent');
  });

  it('Swordmaster completes Step → placement → triggered Sever without losing turn ownership', () => {
    const initial = state();
    initial.match.board[4][4] = 1;
    initial.match.board[4][5] = 2;
    initial.abilities = setAbilityResource(initial.abilities, 1, 'momentum', 3);
    initial.abilities = setAbilityCharge(initial.abilities, 1, 'step', 1);

    const step = listLegalActions(initial, 'swordmaster', 1).find(
      (action) => action.kind === 'ability' && action.abilityId === 'step',
    );
    expect(step).toBeDefined();
    if (!step) return;

    const armed = resolveSessionAction(initial, step, 'swordmaster');
    expect(armed.ok).toBe(true);
    if (!armed.ok) return;
    expect(armed.consumedTurn).toBe(false);
    expect(armed.state.timing?.pendingFollowUp).toMatchObject({ actor: 1, abilityId: 'step', kind: 'precommit' });

    const placement = listLegalActions(armed.state, 'swordmaster', 1).find(
      (action) => action.kind === 'follow-up'
        && action.action.kind === 'place'
        && action.action.at.row === 0
        && action.action.at.col === 0,
    );
    expect(placement).toBeDefined();
    if (!placement) return;

    const placed = resolveSessionAction(armed.state, placement, 'swordmaster');
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(placed.consumedTurn).toBe(false);
    expect(getAbilityCharge(placed.state.abilities, 1, 'step')).toBe(0);
    expect(getAbilityResource(placed.state.abilities, 1, 'momentum')).toBe(3);
    expect(placed.state.timing?.pendingFollowUp).toMatchObject({ actor: 1, abilityId: 'sever', kind: 'triggered' });

    const sever = listLegalActions(placed.state, 'swordmaster', 1).find(
      (action) => action.kind === 'follow-up'
        && action.action.kind === 'ability'
        && action.action.abilityId === 'sever'
        && action.action.source?.row === 4
        && action.action.source?.col === 4
        && action.action.target.row === 4
        && action.action.target.col === 5,
    );
    expect(sever).toBeDefined();
    if (!sever) return;

    const resolved = resolveSessionAction(placed.state, sever, 'swordmaster');
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.state.match.board[4][5]).toBe(0);
    expect(resolved.state.match.board[4][6]).toBe(2);
    expect(getAbilityResource(resolved.state.abilities, 1, 'momentum')).toBe(0);
    expect(resolved.state.match.phase).toBe('opponent');
    expect(resolved.state.timing?.pendingFollowUp).toBeNull();
  });

  it('CPU choreography completes a pending Swordmaster full-turn chain and returns to the player', async () => {
    const session = freeBattle('vanguard', 'swordmaster');
    session.state.match.phase = 'opponent';
    session.state.match.board[4][4] = 2;
    session.state.match.board[4][5] = 1;
    session.state.abilities = setAbilityResource(session.state.abilities, 2, 'momentum', 3);
    session.state.abilities = setAbilityCharge(session.state.abilities, 2, 'step', 1);
    session.state.timing = { pendingFollowUp: { actor: 2, abilityId: 'step', kind: 'precommit' } };
    const controller = createBattleController(session, () => 0);

    await controller.advanceCpuTurn(undefined, {
      thinkDelayMs: 0,
      followUpDelayMs: 0,
      delay: async () => {},
    });

    expect(session.state.match.phase).toBe('player');
    expect(session.state.timing?.pendingFollowUp).toBeNull();
    expect(controller.interaction().cpuThinking).toBe(false);
  });

  it('normal placement and ability placement both terminate the match through the shared session rules', () => {
    const normal = state();
    for (let col = 0; col < 4; col += 1) normal.match.board[2][col] = 1;
    const normalWin = resolveSessionAction(
      normal,
      { kind: 'place', actor: 1, at: { row: 2, col: 4 } },
      'vanguard',
    );
    expect(normalWin.ok).toBe(true);
    if (!normalWin.ok) return;
    expect(normalWin.state.match.status).toBe('victory');
    expect(normalWin.state.match.phase).toBe('over');

    const ability = state();
    for (let col = 0; col < 4; col += 1) ability.match.board[6][col] = 1;
    ability.abilities = setAbilityResource(ability.abilities, 1, 'mana', 3);
    const phase = listLegalActions(ability, 'arcanist', 1).find(
      (action) => action.kind === 'ability'
        && action.abilityId === 'phase'
        && action.target.row === 6
        && action.target.col === 4,
    );
    expect(phase).toBeDefined();
    if (!phase) return;

    const abilityWin = resolveSessionAction(ability, phase, 'arcanist');
    expect(abilityWin.ok).toBe(true);
    if (!abilityWin.ok) return;
    expect(abilityWin.state.match.status).toBe('victory');
    expect(abilityWin.state.match.phase).toBe('over');
  });
});
