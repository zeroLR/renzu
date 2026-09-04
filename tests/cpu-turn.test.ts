import { describe, expect, it } from 'vitest';
import { createMatchState } from '../src/game/match/match-state';
import { createAbilityStates } from '../src/heroes/economies/ability-state';
import { resolvePlaceAction } from '../src/game/action/place-action';
import { resolveCpuTurn } from '../src/app/game-session/cpu-turn';
import type { AbilityActionState } from '../src/game/action/ability-action';

function createState(): AbilityActionState {
  return { match: createMatchState(), abilities: createAbilityStates(), boardEffects: [] };
}

function advanceToCpu(state: AbilityActionState): AbilityActionState {
  const placed = resolvePlaceAction(state.match, 1, { row: 4, col: 4 });
  if (!placed.ok) throw new Error('failed to advance test state');
  return { ...state, match: placed.state };
}

describe('CPU turn session orchestration', () => {
  it('rejects resolution outside the opponent phase', () => {
    const state = createState();
    const result = resolveCpuTurn(state, { heroId: 'vanguard', difficulty: 'normal', random: () => 0 });
    expect(result).toMatchObject({ ok: false, error: 'not-cpu-turn' });
  });

  it('selects from legal actions and returns control to the player', () => {
    const state = advanceToCpu(createState());
    const result = resolveCpuTurn(state, { heroId: 'vanguard', difficulty: 'normal', random: () => 0 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.action.actor).toBe(2);
    expect(result.state.match.phase).toBe('player');
    expect(result.consumedTurn).toBe(true);
    expect(result.state.match.actionHistory).toHaveLength(2);
  });

  it('takes an immediate win through the same decision pipeline', () => {
    let state = advanceToCpu(createState());
    state.match.board[0][0] = 2;
    state.match.board[0][1] = 2;
    state.match.board[0][2] = 2;
    state.match.board[0][3] = 2;

    const result = resolveCpuTurn(state, { heroId: 'vanguard', difficulty: 'easy', random: () => 1 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.decisionReason).toBe('FORCED_TACTICAL');
    expect(result.state.match.status).toBe('defeat');
    expect(result.state.match.phase).toBe('over');
  });

  it('uses the configured difficulty policy without changing the session contract', () => {
    const easyState = advanceToCpu(createState());
    const normalState = advanceToCpu(createState());

    const easy = resolveCpuTurn(easyState, { heroId: 'vanguard', difficulty: 'easy', random: () => 0 });
    const normal = resolveCpuTurn(normalState, { heroId: 'vanguard', difficulty: 'normal', random: () => 0 });

    expect(easy.ok).toBe(true);
    expect(normal.ok).toBe(true);
    if (!easy.ok || !normal.ok) return;
    expect(easy.state.match.phase).toBe('player');
    expect(normal.state.match.phase).toBe('player');
  });
});
