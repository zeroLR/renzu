import { describe, expect, it } from 'vitest';
import { createBattleController } from '../src/app/game-session/battle-controller';
import { createGameSession } from '../src/app/game-session/create-game-session';
import { resolveCpuTurn } from '../src/app/game-session/cpu-turn';
import { resolveSessionAction } from '../src/game/action/action-session';
import type { AbilityActionState } from '../src/game/action/ability-action';
import { listLegalActions } from '../src/game/action/legal-action';
import { createMatchState } from '../src/game/match/match-state';
import { getAbilityResource, setAbilityResource } from '../src/heroes/economies/ability-economy';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import type { HeroId } from '../src/heroes/domain/hero-definition';

function state(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

function freeBattle(playerHeroId: HeroId, cpuHeroId: HeroId = 'vanguard') {
  return createGameSession({
    mode: { kind: 'free-battle' },
    playerHeroId,
    cpuHeroId,
    cpuDifficulty: 'easy',
  });
}

describe('combat characterization gate', () => {
  it('Vanguard pattern guard survives handoff and expires after the CPU turn', async () => {
    const session = freeBattle('vanguard');
    session.state.match.board[4][2] = 1;
    session.state.match.board[4][3] = 1;
    const controller = createBattleController(session, () => 0);

    controller.tapCell({ row: 4, col: 4 });
    expect(session.state.match.phase).toBe('opponent');
    expect(session.state.boardEffects).toContainEqual({
      kind: 'guard', at: { row: 4, col: 4 }, owner: 1, expiry: { kind: 'opponent-turns', remaining: 1 },
    });

    await controller.advanceCpuTurn(undefined, { thinkDelayMs: 0, delay: async () => {} });
    expect(session.state.match.phase).toBe('player');
    expect(session.state.boardEffects.some((effect) => effect.kind === 'guard' && effect.at.row === 4 && effect.at.col === 4)).toBe(false);
  });

  it('Arcanist converts a pattern reward into a real Phase activation lifecycle', () => {
    const initial = state();
    initial.match.board[4][2] = 1;
    initial.match.board[4][3] = 1;
    initial.abilities = setAbilityResource(initial.abilities, 1, 'mana', 2);

    const placed = resolveSessionAction(initial, { kind: 'place', actor: 1, at: { row: 4, col: 4 } }, 'arcanist');
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(getAbilityResource(placed.state.abilities, 1, 'mana')).toBe(3);

    const cpu = resolveCpuTurn(placed.state, { heroId: 'vanguard', difficulty: 'easy', random: () => 0 });
    expect(cpu.ok).toBe(true);
    if (!cpu.ok) return;
    const phase = listLegalActions(cpu.state, 'arcanist', 1).find((action) => action.kind === 'ability' && action.abilityId === 'phase');
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
      (action) => action.kind === 'ability' && action.abilityId === 'corrupt' && action.target.row === 4 && action.target.col === 5,
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

  it('CPU resolves exactly one action and returns control to the player', async () => {
    const session = freeBattle('vanguard', 'arcanist');
    session.state.match.phase = 'opponent';
    const controller = createBattleController(session, () => 0);

    await controller.advanceCpuTurn(undefined, { thinkDelayMs: 0, delay: async () => {} });

    expect(session.state.match.phase).toBe('player');
    expect(session.state.match.actionHistory).toHaveLength(1);
    expect(controller.interaction().cpuThinking).toBe(false);
  });

  it('normal placement and ability placement both terminate the match through shared session rules', () => {
    const normal = state();
    for (let col = 0; col < 4; col += 1) normal.match.board[2][col] = 1;
    const normalWin = resolveSessionAction(normal, { kind: 'place', actor: 1, at: { row: 2, col: 4 } }, 'vanguard');
    expect(normalWin.ok).toBe(true);
    if (!normalWin.ok) return;
    expect(normalWin.state.match.status).toBe('victory');
    expect(normalWin.state.match.phase).toBe('over');

    const ability = state();
    for (let col = 0; col < 4; col += 1) ability.match.board[6][col] = 1;
    ability.abilities = setAbilityResource(ability.abilities, 1, 'mana', 3);
    const phase = listLegalActions(ability, 'arcanist', 1).find(
      (action) => action.kind === 'ability' && action.abilityId === 'phase' && action.target.row === 6 && action.target.col === 4,
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
