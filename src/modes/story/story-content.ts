import type { AiDifficultyId } from '../../ai/difficulty/difficulty-profile';
import type { HeroId } from '../../heroes/domain/hero-definition';
import type { PlayerProfile, StoryEncounterId } from '../../progression/profile/player-profile';

export interface StoryEncounterDefinition {
  id: StoryEncounterId;
  order: number;
  playerHeroId: HeroId;
  cpuHeroId: HeroId;
  cpuDifficulty: AiDifficultyId;
  concepts: readonly string[];
  boss?: boolean;
}

export const EASY_STORY_ENCOUNTERS: readonly StoryEncounterDefinition[] = [
  { id: 'E1-1', order: 1, playerHeroId: 'vanguard', cpuHeroId: 'vanguard', cpuDifficulty: 'easy', concepts: ['legal-placement', 'five-in-row'] },
  { id: 'E1-2', order: 2, playerHeroId: 'vanguard', cpuHeroId: 'vanguard', cpuDifficulty: 'easy', concepts: ['open-two', 'open-three', 'basic-block'] },
  { id: 'E1-3', order: 3, playerHeroId: 'vanguard', cpuHeroId: 'vanguard', cpuDifficulty: 'easy', concepts: ['hero-engine', 'ability-readiness'] },
  { id: 'E1-4', order: 4, playerHeroId: 'vanguard', cpuHeroId: 'vanguard', cpuDifficulty: 'easy', concepts: ['blink'] },
  { id: 'E1-5', order: 5, playerHeroId: 'vanguard', cpuHeroId: 'vanguard', cpuDifficulty: 'easy', concepts: ['charge'] },
  { id: 'E1-BOSS', order: 6, playerHeroId: 'vanguard', cpuHeroId: 'vanguard', cpuDifficulty: 'normal', concepts: ['chapter-mastery'], boss: true },
];

export function storyEncounter(id: StoryEncounterId): StoryEncounterDefinition | undefined {
  return EASY_STORY_ENCOUNTERS.find((encounter) => encounter.id === id);
}

export function isStoryEncounterUnlocked(profile: PlayerProfile, id: StoryEncounterId): boolean {
  const encounter = storyEncounter(id);
  if (!encounter) return false;
  if (encounter.order === 1) return true;
  const previous = EASY_STORY_ENCOUNTERS.find((item) => item.order === encounter.order - 1);
  return !!previous && profile.story.completedEncounterIds.includes(previous.id);
}

export function nextStoryEncounterId(profile: PlayerProfile): StoryEncounterId | null {
  return EASY_STORY_ENCOUNTERS.find((encounter) => !profile.story.completedEncounterIds.includes(encounter.id))?.id ?? null;
}
