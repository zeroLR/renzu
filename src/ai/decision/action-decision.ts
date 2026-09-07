import type { Player } from '../../game/board/board';
import type { LegalAction } from '../../game/action/legal-action';
import type { AbilityActionState } from '../../game/action/ability-action';
import type { HeroId } from '../../heroes/domain/hero-definition';
import { rankActions, type EvaluatedAction } from '../evaluation/action-evaluator';
import type { AiDifficultyProfile } from '../difficulty/difficulty-profile';

export interface AiDecision extends EvaluatedAction {
  bestScore: number;
  regret: number;
  decisionReason: 'FORCED_TACTICAL' | 'BEST_SCORE' | 'DIFFICULTY_VARIANCE';
  topCandidates: readonly EvaluatedAction[];
}

export function chooseAction(
  state: AbilityActionState,
  actions: readonly LegalAction[],
  actor: Player,
  heroId: HeroId,
  profile: AiDifficultyProfile,
  random: () => number = Math.random,
): AiDecision | null {
  const ranked = rankActions(state, actions, actor, heroId, profile);
  if (!ranked.length) return null;

  const best = ranked[0];
  const forced = ranked.find((candidate) =>
    candidate.reasons.includes('IMMEDIATE_WIN') || candidate.reasons.includes('FORCED_BLOCK'),
  );
  const topCandidates = ranked.slice(0, 5);

  if (forced) {
    return {
      ...forced,
      bestScore: best.score,
      regret: Math.max(0, best.score - forced.score),
      decisionReason: 'FORCED_TACTICAL',
      topCandidates,
    };
  }

  const width = Math.max(1, Math.min(profile.candidateWidth, ranked.length));
  let selected = best;
  let decisionReason: AiDecision['decisionReason'] = 'BEST_SCORE';

  if (random() > profile.optimalMoveRate && width > 1) {
    const floor = best.score * (1 - profile.blunderTolerance);
    const pool = ranked.slice(1, width).filter((candidate) => candidate.score >= floor);
    if (pool.length) {
      selected = pool[Math.floor(random() * pool.length)];
      decisionReason = 'DIFFICULTY_VARIANCE';
    }
  }

  return {
    ...selected,
    bestScore: best.score,
    regret: Math.max(0, best.score - selected.score),
    decisionReason,
    topCandidates,
  };
}
