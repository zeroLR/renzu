import { describe, expect, it } from 'vitest';
import { createProductFlow } from '../src/app/game-session/product-flow';
import type { PlayerProfileStorage } from '../src/platform/storage/player-profile-storage';
import { createPlayerProfile } from '../src/progression/profile/player-profile';
import { endMatch } from '../src/game/match/match-state';

function memoryStorage(): PlayerProfileStorage & { saves(): number } {
  let profile = createPlayerProfile();
  let saveCount = 0;
  return {
    load: () => profile,
    save(next) {
      profile = next;
      saveCount += 1;
      return profile;
    },
    clear() {
      profile = createPlayerProfile();
      return profile;
    },
    saves: () => saveCount,
  };
}

describe('battle result lifecycle', () => {
  it('persists a Story victory exactly once and unlocks the next encounter', () => {
    const storage = memoryStorage();
    const flow = createProductFlow(storage);
    const started = flow.startStory('E1-1');
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    started.session.state = {
      ...started.session.state,
      match: endMatch(started.session.state.match, 'victory'),
    };

    const first = flow.settleActiveSession();
    const second = flow.settleActiveSession();

    expect(first).toEqual({ settled: true, storyCompleted: 'E1-1', nextStoryEncounterId: 'E1-2' });
    expect(second.storyCompleted).toBe('E1-1');
    expect(storage.saves()).toBe(1);
    expect(flow.snapshot().profile.story.completedEncounterIds).toContain('E1-1');
    expect(flow.startNextStoryEncounter().ok).toBe(true);
  });

  it('does not advance Story progress after defeat', () => {
    const storage = memoryStorage();
    const flow = createProductFlow(storage);
    const started = flow.startStory('E1-1');
    if (!started.ok) throw new Error('expected story session');
    started.session.state = {
      ...started.session.state,
      match: endMatch(started.session.state.match, 'defeat'),
    };

    expect(flow.settleActiveSession()).toEqual({ settled: true, storyCompleted: null, nextStoryEncounterId: null });
    expect(flow.snapshot().profile.story.completedEncounterIds).toEqual([]);
    expect(storage.saves()).toBe(0);
  });

  it('rematch resets the match while preserving the same config', () => {
    const flow = createProductFlow(memoryStorage());
    const started = flow.startFreeBattle();
    if (!started.ok) throw new Error('expected free battle session');
    const originalConfig = started.session.config;
    started.session.state = {
      ...started.session.state,
      match: endMatch(started.session.state.match, 'draw'),
    };

    const rematch = flow.rematch();
    expect(rematch.ok).toBe(true);
    if (!rematch.ok) return;
    expect(rematch.session.config).toEqual(originalConfig);
    expect(rematch.session.state.match.status).toBe('playing');
    expect(rematch.session.state.match.turn).toBe(1);
  });
});
