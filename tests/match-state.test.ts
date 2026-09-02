import { describe, expect, it } from 'vitest';
import { activePlayer, acceptsPlayerInput, completeTurn, createMatchState, endMatch } from '../src/game/match/match-state';

describe('match state', () => {
  it('starts on player turn and accepts input', () => {
    const state = createMatchState();
    expect(state.turn).toBe(1);
    expect(state.phase).toBe('player');
    expect(state.status).toBe('playing');
    expect(activePlayer(state)).toBe(1);
    expect(acceptsPlayerInput(state)).toBe(true);
  });

  it('hands a completed player turn to the opponent and increments the round turn', () => {
    const state = completeTurn(createMatchState(), 1);
    expect(state.turn).toBe(2);
    expect(state.phase).toBe('opponent');
    expect(activePlayer(state)).toBe(2);
  });

  it('returns control to the player after opponent completion without another turn increment', () => {
    const opponentState = completeTurn(createMatchState(), 1);
    const state = completeTurn(opponentState, 2);
    expect(state.turn).toBe(2);
    expect(state.phase).toBe('player');
    expect(activePlayer(state)).toBe(1);
  });

  it('ends the match and disables further input', () => {
    const state = endMatch(createMatchState(), 'victory');
    expect(state.phase).toBe('over');
    expect(state.status).toBe('victory');
    expect(activePlayer(state)).toBeNull();
    expect(acceptsPlayerInput(state)).toBe(false);
  });
});
