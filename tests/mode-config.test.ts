import { describe, expect, it } from 'vitest';
import { createFreeBattleSessionConfig } from '../src/modes/free-battle/free-battle-config';
import { EASY_STORY_ENCOUNTERS, isStoryEncounterUnlocked, nextStoryEncounterId } from '../src/modes/story/story-content';
import { completeStoryEncounter, createPlayerProfile, unlockHero } from '../src/progression/profile/player-profile';

describe('mode configuration', () => {
  it('keeps Easy story sequential and previews Normal at the boss', () => {
    expect(EASY_STORY_ENCOUNTERS.map((encounter) => encounter.id)).toEqual(['E1-1', 'E1-2', 'E1-3', 'E1-4', 'E1-5', 'E1-BOSS']);
    expect(EASY_STORY_ENCOUNTERS.slice(0, 5).every((encounter) => encounter.cpuDifficulty === 'easy')).toBe(true);
    expect(EASY_STORY_ENCOUNTERS.at(-1)).toMatchObject({ id: 'E1-BOSS', cpuDifficulty: 'normal', boss: true });
  });

  it('unlocks story encounters sequentially from profile progress', () => {
    let profile = createPlayerProfile();
    expect(isStoryEncounterUnlocked(profile, 'E1-1')).toBe(true);
    expect(isStoryEncounterUnlocked(profile, 'E1-2')).toBe(false);
    profile = completeStoryEncounter(profile, 'E1-1');
    expect(isStoryEncounterUnlocked(profile, 'E1-2')).toBe(true);
    expect(nextStoryEncounterId(profile)).toBe('E1-2');
  });

  it('rejects locked player heroes in Free Battle but allows unlocked ones', () => {
    let profile = createPlayerProfile();
    expect(createFreeBattleSessionConfig(profile, { playerHeroId: 'shade', cpuHeroId: 'vanguard', cpuDifficulty: 'easy' })).toBe('hero-locked');
    profile = unlockHero(profile, 'shade');
    expect(createFreeBattleSessionConfig(profile, { playerHeroId: 'shade', cpuHeroId: 'vanguard', cpuDifficulty: 'normal' })).toEqual({
      mode: 'free-battle', playerHeroId: 'shade', cpuHeroId: 'vanguard', cpuDifficulty: 'normal',
    });
  });
});
