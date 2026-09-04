import { heroIds, type HeroId } from '../../heroes/domain/hero-definition';

export const PLAYER_PROFILE_VERSION = 1 as const;
export type StoryEncounterId = 'E1-1' | 'E1-2' | 'E1-3' | 'E1-4' | 'E1-5' | 'E1-BOSS';

export interface StoryProgress {
  completedEncounterIds: readonly StoryEncounterId[];
  lastEncounterId: StoryEncounterId | null;
}

export interface PlayerProfile {
  version: typeof PLAYER_PROFILE_VERSION;
  unlockedHeroes: readonly HeroId[];
  soul: number;
  skillFragments: number;
  story: StoryProgress;
}

const STORY_IDS: readonly StoryEncounterId[] = ['E1-1', 'E1-2', 'E1-3', 'E1-4', 'E1-5', 'E1-BOSS'];

export function createPlayerProfile(): PlayerProfile {
  return {
    version: PLAYER_PROFILE_VERSION,
    unlockedHeroes: ['vanguard'],
    soul: 0,
    skillFragments: 0,
    story: { completedEncounterIds: [], lastEncounterId: null },
  };
}

export function normalizePlayerProfile(value: unknown): PlayerProfile {
  if (!value || typeof value !== 'object') return createPlayerProfile();
  const source = value as Partial<PlayerProfile>;
  const unlocked = Array.isArray(source.unlockedHeroes)
    ? source.unlockedHeroes.filter((id): id is HeroId => heroIds.includes(id as HeroId))
    : [];
  if (!unlocked.includes('vanguard')) unlocked.unshift('vanguard');

  const story = source.story && typeof source.story === 'object' ? source.story : undefined;
  const completed = Array.isArray(story?.completedEncounterIds)
    ? story.completedEncounterIds.filter((id): id is StoryEncounterId => STORY_IDS.includes(id as StoryEncounterId))
    : [];
  const last = story?.lastEncounterId && completed.includes(story.lastEncounterId) ? story.lastEncounterId : null;

  return {
    version: PLAYER_PROFILE_VERSION,
    unlockedHeroes: [...new Set(unlocked)],
    soul: Number.isFinite(source.soul) ? Math.max(0, Number(source.soul)) : 0,
    skillFragments: Number.isFinite(source.skillFragments) ? Math.max(0, Number(source.skillFragments)) : 0,
    story: { completedEncounterIds: [...new Set(completed)], lastEncounterId: last },
  };
}

export function unlockHero(profile: PlayerProfile, heroId: HeroId): PlayerProfile {
  if (profile.unlockedHeroes.includes(heroId)) return profile;
  return { ...profile, unlockedHeroes: [...profile.unlockedHeroes, heroId] };
}

export function grantSoul(profile: PlayerProfile, amount: number): PlayerProfile {
  return { ...profile, soul: Math.max(0, profile.soul + Math.max(0, amount)) };
}

export function completeStoryEncounter(profile: PlayerProfile, encounterId: StoryEncounterId): PlayerProfile {
  const completed = profile.story.completedEncounterIds.includes(encounterId)
    ? profile.story.completedEncounterIds
    : [...profile.story.completedEncounterIds, encounterId];
  return { ...profile, story: { completedEncounterIds: completed, lastEncounterId: encounterId } };
}
