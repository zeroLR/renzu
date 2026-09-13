import { heroIds, type HeroId } from '../../heroes/domain/hero-definition';
import type { BalanceMatchSummary, BalanceRunResult } from './balance-simulation';

export interface BalanceValiditySummary {
  totalGames: number;
  validGames: number;
  errors: number;
  stalled: number;
  errorRate: number;
  stalledRate: number;
  placementRate: number;
}

export interface SeatAdjustedPairSummary extends BalanceValiditySummary {
  heroA: HeroId;
  heroB: HeroId;
  heroAWins: number;
  heroBWins: number;
  draws: number;
  heroAWinRate: number;
  heroBWinRate: number;
  avgActions: number;
}

export interface MirrorSeatSummary extends BalanceValiditySummary {
  heroId: HeroId;
  p1Wins: number;
  p2Wins: number;
  draws: number;
  p1WinRate: number;
  avgActions: number;
}

export interface BalanceResultAnalysis {
  validity: BalanceValiditySummary;
  pairs: readonly SeatAdjustedPairSummary[];
  mirrors: readonly MirrorSeatSummary[];
}

const SUPPORT_ABILITIES = new Set(['guard']);

function fullTurnAbilityActions(match: BalanceMatchSummary): number {
  return Object.entries(match.abilityUses).reduce(
    (sum, [abilityId, count]) => sum + (SUPPORT_ABILITIES.has(abilityId) ? 0 : count),
    0,
  );
}

function placements(match: BalanceMatchSummary): number {
  return Math.max(0, match.actions - fullTurnAbilityActions(match));
}

function validity(matches: readonly BalanceMatchSummary[]): BalanceValiditySummary {
  const errors = matches.filter((match) => match.status === 'error').length;
  const stalled = matches.filter((match) => match.status === 'stalled').length;
  const validGames = matches.length - errors - stalled;
  const totalActions = matches.reduce((sum, match) => sum + match.actions, 0);
  const totalPlacements = matches.reduce((sum, match) => sum + placements(match), 0);
  return {
    totalGames: matches.length,
    validGames,
    errors,
    stalled,
    errorRate: matches.length ? errors / matches.length : 0,
    stalledRate: matches.length ? stalled / matches.length : 0,
    placementRate: totalActions ? totalPlacements / totalActions : 0,
  };
}

function winnerHero(match: BalanceMatchSummary): HeroId | null {
  if (match.status === 'p1-win') return match.p1Hero;
  if (match.status === 'p2-win') return match.p2Hero;
  return null;
}

function pairSummary(
  matches: readonly BalanceMatchSummary[],
  heroA: HeroId,
  heroB: HeroId,
): SeatAdjustedPairSummary {
  const pairMatches = matches.filter((match) =>
    (match.p1Hero === heroA && match.p2Hero === heroB)
    || (match.p1Hero === heroB && match.p2Hero === heroA),
  );
  const base = validity(pairMatches);
  const heroAWins = pairMatches.filter((match) => winnerHero(match) === heroA).length;
  const heroBWins = pairMatches.filter((match) => winnerHero(match) === heroB).length;
  const draws = pairMatches.filter((match) => match.status === 'draw').length;
  const resolved = Math.max(1, heroAWins + heroBWins + draws);
  return {
    heroA,
    heroB,
    ...base,
    heroAWins,
    heroBWins,
    draws,
    heroAWinRate: heroAWins / resolved,
    heroBWinRate: heroBWins / resolved,
    avgActions: pairMatches.length
      ? pairMatches.reduce((sum, match) => sum + match.actions, 0) / pairMatches.length
      : 0,
  };
}

function mirrorSummary(matches: readonly BalanceMatchSummary[], heroId: HeroId): MirrorSeatSummary {
  const mirrorMatches = matches.filter((match) => match.p1Hero === heroId && match.p2Hero === heroId);
  const base = validity(mirrorMatches);
  const p1Wins = mirrorMatches.filter((match) => match.status === 'p1-win').length;
  const p2Wins = mirrorMatches.filter((match) => match.status === 'p2-win').length;
  const draws = mirrorMatches.filter((match) => match.status === 'draw').length;
  const resolved = Math.max(1, p1Wins + p2Wins + draws);
  return {
    heroId,
    ...base,
    p1Wins,
    p2Wins,
    draws,
    p1WinRate: p1Wins / resolved,
    avgActions: mirrorMatches.length
      ? mirrorMatches.reduce((sum, match) => sum + match.actions, 0) / mirrorMatches.length
      : 0,
  };
}

export function analyzeBalanceResult(result: BalanceRunResult): BalanceResultAnalysis {
  const pairs: SeatAdjustedPairSummary[] = [];
  for (let left = 0; left < heroIds.length; left += 1) {
    for (let right = left + 1; right < heroIds.length; right += 1) {
      pairs.push(pairSummary(result.matches, heroIds[left], heroIds[right]));
    }
  }
  return {
    validity: validity(result.matches),
    pairs,
    mirrors: heroIds.map((heroId) => mirrorSummary(result.matches, heroId)),
  };
}
