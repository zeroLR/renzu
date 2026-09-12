import { resolveAiTurn } from '../../app/game-session/cpu-turn';
import { createGameSession } from '../../app/game-session/create-game-session';
import type { GameSession } from '../../app/game-session/create-game-session';
import type { AiDifficultyProfile } from '../../ai/difficulty/difficulty-profile';
import { simulateTacticalAction } from '../../ai/evaluation/tactical-simulation';
import type { AbilityActionState } from '../../game/action/ability-action';
import type { LegalAction } from '../../game/action/legal-action';
import type { Board, Player, Position } from '../../game/board/board';
import { activePlayer } from '../../game/match/match-state';
import {
  evaluatePlacementPattern,
  type PlacementPatternEventKind,
} from '../../game/rules/placement-pattern';
import type { AbilityStates } from '../../heroes/economies/ability-state';
import { heroIds, type AbilityId, type HeroId } from '../../heroes/domain/hero-definition';

export type BalanceScope = 'pair' | 'matrix';
export type BalanceMatchStatus = 'p1-win' | 'p2-win' | 'draw' | 'stalled' | 'error';

export interface BalanceLabConfig {
  scope: BalanceScope;
  heroA: HeroId;
  heroB: HeroId;
  gamesPerSeat: number;
  swapSeats: boolean;
  seed: number;
  maxActions: number;
  profile: AiDifficultyProfile;
}

export interface BalanceProgress {
  completed: number;
  total: number;
}

export interface BalanceActionTrace {
  index: number;
  turn: number;
  actor: Player;
  heroId: HeroId;
  kind: LegalAction['kind'];
  abilityId?: AbilityId;
  at: Position;
  source?: Position;
  score: number;
  reasons: readonly string[];
  patternEvents: readonly PlacementPatternEventKind[];
  enemyThreatsBefore: number;
  enemyThreatsAfter: number;
  ownLineBefore: number;
  ownLineAfter: number;
  enemyLineBefore: number;
  enemyLineAfter: number;
  enemyStonesRemoved: number;
  newDenials: number;
}

export interface BalanceMatchSummary {
  id: number;
  seed: number;
  p1Hero: HeroId;
  p2Hero: HeroId;
  status: BalanceMatchStatus;
  actions: number;
  winner: Player | null;
  abilityUses: Readonly<Record<string, number>>;
  patternEvents: Readonly<Record<string, number>>;
  conversionAbility: AbilityId | null;
  flags: readonly string[];
}

export interface BalanceMatchupSummary {
  p1Hero: HeroId;
  p2Hero: HeroId;
  games: number;
  p1Wins: number;
  p2Wins: number;
  draws: number;
  stalled: number;
  errors: number;
  p1WinRate: number;
  avgActions: number;
}

export interface BalanceHeroSummary {
  heroId: HeroId;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  abilityUsesPerGame: number;
}

export interface BalanceConversionSummary {
  abilityId: AbilityId;
  uses: number;
  winsWithinTwoOwnActions: number;
  rate: number;
}

export interface BalanceRunResult {
  config: BalanceLabConfig;
  totalGames: number;
  p1WinRate: number;
  drawRate: number;
  stalledRate: number;
  avgActions: number;
  p50Actions: number;
  p90Actions: number;
  matches: readonly BalanceMatchSummary[];
  matchups: readonly BalanceMatchupSummary[];
  heroes: readonly BalanceHeroSummary[];
  abilityUses: Readonly<Record<string, number>>;
  patternEvents: Readonly<Record<string, number>>;
  conversions: readonly BalanceConversionSummary[];
  anomalies: readonly BalanceMatchSummary[];
}

export interface BalanceReplay {
  match: BalanceMatchSummary;
  actions: readonly BalanceActionTrace[];
  snapshots: readonly AbilityActionState[];
}

interface RawMatchRun {
  summary: BalanceMatchSummary;
  traces: BalanceActionTrace[];
  snapshots?: AbilityActionState[];
}

interface ScheduledMatch {
  id: number;
  seed: number;
  p1Hero: HeroId;
  p2Hero: HeroId;
}

export interface RunBalanceOptions {
  onProgress?: (progress: BalanceProgress) => void;
  yieldEvery?: number;
  yieldControl?: () => Promise<void>;
}

const TOPOLOGY_ABILITIES = new Set<AbilityId>(['charge', 'phase', 'corrupt']);
const defaultYield = (): Promise<void> => new Promise((resolve) => globalThis.setTimeout(resolve, 0));

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cloneAbilities(abilities: AbilityStates): AbilityStates {
  return {
    1: {
      resources: { ...abilities[1].resources },
      cooldowns: { ...abilities[1].cooldowns },
      conditions: { ...abilities[1].conditions },
      charges: { ...abilities[1].charges },
      usesSpent: { ...abilities[1].usesSpent },
    },
    2: {
      resources: { ...abilities[2].resources },
      cooldowns: { ...abilities[2].cooldowns },
      conditions: { ...abilities[2].conditions },
      charges: { ...abilities[2].charges },
      usesSpent: { ...abilities[2].usesSpent },
    },
  };
}

export function cloneActionState(state: AbilityActionState): AbilityActionState {
  return {
    match: {
      ...state.match,
      board: state.match.board.map((row) => [...row]),
      actionHistory: state.match.actionHistory.map((action) => ({
        ...action,
        at: { ...action.at },
        source: action.source ? { ...action.source } : undefined,
      })),
    },
    abilities: cloneAbilities(state.abilities),
    boardEffects: state.boardEffects.map((effect) => ({
      ...effect,
      at: { ...effect.at },
      expiry: { ...effect.expiry },
    })),
  };
}

function sessionFor(p1Hero: HeroId, p2Hero: HeroId): GameSession {
  return createGameSession({
    mode: { kind: 'free-battle' },
    playerHeroId: p1Hero,
    cpuHeroId: p2Hero,
    cpuDifficulty: 'normal',
  });
}

function abilityIdFor(action: LegalAction): AbilityId | undefined {
  if (action.kind === 'ability') return action.abilityId;
  return action.support?.abilityId;
}

function increment(record: Record<string, number>, key: string, amount = 1): void {
  record[key] = (record[key] ?? 0) + amount;
}

function winnerFor(state: AbilityActionState): Player | null {
  if (state.match.status === 'victory') return 1;
  if (state.match.status === 'defeat') return 2;
  return null;
}

function statusFor(state: AbilityActionState, capped: boolean, failed: boolean): BalanceMatchStatus {
  if (failed) return 'error';
  if (capped && state.match.status === 'playing') return 'stalled';
  if (state.match.status === 'victory') return 'p1-win';
  if (state.match.status === 'defeat') return 'p2-win';
  if (state.match.status === 'draw') return 'draw';
  return 'stalled';
}

function positionKey(position: Position): string {
  return `${position.row}:${position.col}`;
}

function countAbilityUsesById(traces: readonly BalanceActionTrace[]): Record<string, number> {
  const uses: Record<string, number> = {};
  for (const trace of traces) {
    if (trace.abilityId) increment(uses, trace.abilityId);
  }
  return uses;
}

function winningConversionAbility(
  traces: readonly BalanceActionTrace[],
  winner: Player | null,
): AbilityId | null {
  if (!winner) return null;
  let ownActionsSeen = 0;
  for (let index = traces.length - 1; index >= 0; index -= 1) {
    const trace = traces[index];
    if (trace.actor !== winner) continue;
    ownActionsSeen += 1;
    if (trace.abilityId && TOPOLOGY_ABILITIES.has(trace.abilityId)) return trace.abilityId;
    if (ownActionsSeen >= 2) return null;
  }
  return null;
}

function simulateOneMatch(
  scheduled: ScheduledMatch,
  config: BalanceLabConfig,
  includeSnapshots: boolean,
): RawMatchRun {
  const random = createSeededRandom(scheduled.seed);
  const session = sessionFor(scheduled.p1Hero, scheduled.p2Hero);
  let state = session.state;
  const traces: BalanceActionTrace[] = [];
  const snapshots = includeSnapshots ? [cloneActionState(state)] : undefined;
  const abilityUses: Record<string, number> = {};
  const patternEvents: Record<string, number> = {};
  let failed = false;

  for (let actionIndex = 0; actionIndex < config.maxActions && state.match.status === 'playing'; actionIndex += 1) {
    const actor = activePlayer(state.match);
    if (!actor) break;
    const heroId = actor === 1 ? scheduled.p1Hero : scheduled.p2Hero;
    const before = state;
    const turn = resolveAiTurn(before, actor, {
      heroId,
      profile: config.profile,
      random,
    });

    if (!turn.ok) {
      failed = true;
      break;
    }

    const action = turn.decision.action;
    const abilityId = abilityIdFor(action);
    const tactical = simulateTacticalAction(before, action, actor, heroId);
    const next = turn.state;
    const events = action.kind === 'place'
      ? evaluatePlacementPattern(next.match.board, action.at, actor, before.boardEffects).events.map((event) => event.kind)
      : [];

    if (abilityId) increment(abilityUses, abilityId);
    for (const event of events) increment(patternEvents, event);

    traces.push({
      index: actionIndex,
      turn: before.match.turn,
      actor,
      heroId,
      kind: action.kind,
      abilityId,
      at: { ...action.at },
      source: action.kind === 'ability' && action.source ? { ...action.source } : undefined,
      score: turn.decision.score,
      reasons: [...turn.decision.reasons],
      patternEvents: events,
      enemyThreatsBefore: tactical?.enemyThreatsBefore ?? 0,
      enemyThreatsAfter: tactical?.enemyThreatsAfter ?? 0,
      ownLineBefore: tactical?.ownLineBefore ?? 0,
      ownLineAfter: tactical?.ownLineAfter ?? 0,
      enemyLineBefore: tactical?.enemyLineBefore ?? 0,
      enemyLineAfter: tactical?.enemyLineAfter ?? 0,
      enemyStonesRemoved: tactical?.enemyStonesRemoved ?? 0,
      newDenials: tactical?.newDenials ?? 0,
    });

    state = next;
    snapshots?.push(cloneActionState(state));
  }

  const capped = state.match.status === 'playing' && traces.length >= config.maxActions;
  const winner = winnerFor(state);
  const status = statusFor(state, capped, failed);
  const baseFlags: string[] = [];
  if (status === 'stalled') baseFlags.push('STALLED');
  if (status === 'error') baseFlags.push('SIMULATION_ERROR');
  const conversionAbility = winningConversionAbility(traces, winner);
  if (conversionAbility) baseFlags.push('ABILITY_CONVERSION');

  return {
    summary: {
      id: scheduled.id,
      seed: scheduled.seed,
      p1Hero: scheduled.p1Hero,
      p2Hero: scheduled.p2Hero,
      status,
      actions: traces.length,
      winner,
      abilityUses,
      patternEvents,
      conversionAbility,
      flags: baseFlags,
    },
    traces,
    snapshots,
  };
}

function buildSchedule(config: BalanceLabConfig): ScheduledMatch[] {
  const scheduled: ScheduledMatch[] = [];
  let id = 1;
  const pushSeat = (p1Hero: HeroId, p2Hero: HeroId): void => {
    for (let gameIndex = 0; gameIndex < config.gamesPerSeat; gameIndex += 1) {
      scheduled.push({
        id: id++,
        seed: config.seed + gameIndex * 9973,
        p1Hero,
        p2Hero,
      });
    }
  };

  if (config.scope === 'matrix') {
    for (const p1Hero of heroIds) {
      for (const p2Hero of heroIds) pushSeat(p1Hero, p2Hero);
    }
    return scheduled;
  }

  pushSeat(config.heroA, config.heroB);
  if (config.swapSeats && config.heroA !== config.heroB) pushSeat(config.heroB, config.heroA);
  return scheduled;
}

function percentile(values: readonly number[], fraction: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index];
}

function summarizeMatchups(matches: readonly BalanceMatchSummary[]): BalanceMatchupSummary[] {
  const groups = new Map<string, BalanceMatchSummary[]>();
  for (const match of matches) {
    const key = `${match.p1Hero}>${match.p2Hero}`;
    groups.set(key, [...(groups.get(key) ?? []), match]);
  }

  return [...groups.values()].map((group) => {
    const p1Wins = group.filter((match) => match.status === 'p1-win').length;
    const p2Wins = group.filter((match) => match.status === 'p2-win').length;
    const draws = group.filter((match) => match.status === 'draw').length;
    const stalled = group.filter((match) => match.status === 'stalled').length;
    const errors = group.filter((match) => match.status === 'error').length;
    const resolved = Math.max(1, p1Wins + p2Wins + draws);
    return {
      p1Hero: group[0].p1Hero,
      p2Hero: group[0].p2Hero,
      games: group.length,
      p1Wins,
      p2Wins,
      draws,
      stalled,
      errors,
      p1WinRate: p1Wins / resolved,
      avgActions: group.reduce((sum, match) => sum + match.actions, 0) / group.length,
    };
  });
}

function summarizeHeroes(matches: readonly BalanceMatchSummary[]): BalanceHeroSummary[] {
  return heroIds.map((heroId) => {
    let games = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let abilityUses = 0;

    for (const match of matches) {
      const p1 = match.p1Hero === heroId;
      const p2 = match.p2Hero === heroId;
      if (!p1 && !p2) continue;
      games += 1;
      if (match.status === 'draw') draws += 1;
      else if ((p1 && match.status === 'p1-win') || (p2 && match.status === 'p2-win')) wins += 1;
      else if ((p1 && match.status === 'p2-win') || (p2 && match.status === 'p1-win')) losses += 1;
      abilityUses += Object.values(match.abilityUses).reduce((sum, count) => sum + count, 0);
    }

    const resolved = Math.max(1, wins + losses + draws);
    return {
      heroId,
      games,
      wins,
      losses,
      draws,
      winRate: wins / resolved,
      abilityUsesPerGame: games ? abilityUses / games : 0,
    };
  }).filter((summary) => summary.games > 0);
}

function conversionSummaries(matches: readonly BalanceMatchSummary[]): BalanceConversionSummary[] {
  const useCounts: Record<string, number> = {};
  const conversionCounts: Record<string, number> = {};

  for (const match of matches) {
    for (const [abilityId, count] of Object.entries(match.abilityUses)) increment(useCounts, abilityId, count);
    if (match.conversionAbility) increment(conversionCounts, match.conversionAbility);
  }

  return Object.entries(useCounts).map(([abilityId, uses]) => ({
    abilityId: abilityId as AbilityId,
    uses,
    winsWithinTwoOwnActions: conversionCounts[abilityId] ?? 0,
    rate: uses ? (conversionCounts[abilityId] ?? 0) / uses : 0,
  })).sort((a, b) => b.rate - a.rate);
}

function annotateAnomalies(
  matches: readonly BalanceMatchSummary[],
  p10Actions: number,
  p90Actions: number,
): BalanceMatchSummary[] {
  return matches.map((match) => {
    const flags = [...match.flags];
    if (match.status !== 'error' && match.status !== 'stalled') {
      if (match.actions <= p10Actions && match.actions <= 18) flags.push('SHORT_OUTLIER');
      if (match.actions >= p90Actions && match.actions >= 36) flags.push('LONG_OUTLIER');
    }
    const maxAbilityUses = Math.max(0, ...Object.values(match.abilityUses));
    if (maxAbilityUses >= 5) flags.push('ABILITY_LOOP');
    return { ...match, flags: [...new Set(flags)] };
  });
}

function anomalyScore(match: BalanceMatchSummary): number {
  let score = 0;
  if (match.flags.includes('SIMULATION_ERROR')) score += 100;
  if (match.flags.includes('STALLED')) score += 80;
  if (match.flags.includes('ABILITY_LOOP')) score += 40;
  if (match.flags.includes('ABILITY_CONVERSION')) score += 30;
  if (match.flags.includes('LONG_OUTLIER')) score += 20;
  if (match.flags.includes('SHORT_OUTLIER')) score += 10;
  return score;
}

export async function runBalanceSimulation(
  config: BalanceLabConfig,
  options: RunBalanceOptions = {},
): Promise<BalanceRunResult> {
  const schedule = buildSchedule(config);
  const rawMatches: BalanceMatchSummary[] = [];
  const yieldEvery = Math.max(1, options.yieldEvery ?? 8);
  const yieldControl = options.yieldControl ?? defaultYield;

  options.onProgress?.({ completed: 0, total: schedule.length });
  for (let index = 0; index < schedule.length; index += 1) {
    rawMatches.push(simulateOneMatch(schedule[index], config, false).summary);
    if ((index + 1) % yieldEvery === 0 || index === schedule.length - 1) {
      options.onProgress?.({ completed: index + 1, total: schedule.length });
      await yieldControl();
    }
  }

  const actionCounts = rawMatches.map((match) => match.actions);
  const p10Actions = percentile(actionCounts, 0.1);
  const p50Actions = percentile(actionCounts, 0.5);
  const p90Actions = percentile(actionCounts, 0.9);
  const matches = annotateAnomalies(rawMatches, p10Actions, p90Actions);
  const abilityUses: Record<string, number> = {};
  const patternEvents: Record<string, number> = {};
  for (const match of matches) {
    for (const [key, count] of Object.entries(match.abilityUses)) increment(abilityUses, key, count);
    for (const [key, count] of Object.entries(match.patternEvents)) increment(patternEvents, key, count);
  }

  const p1Wins = matches.filter((match) => match.status === 'p1-win').length;
  const draws = matches.filter((match) => match.status === 'draw').length;
  const stalled = matches.filter((match) => match.status === 'stalled').length;
  const resolved = Math.max(1, matches.filter((match) => match.status !== 'error' && match.status !== 'stalled').length);
  const anomalies = matches
    .filter((match) => match.flags.length > 0)
    .sort((a, b) => anomalyScore(b) - anomalyScore(a) || b.actions - a.actions)
    .slice(0, 24);

  return {
    config: {
      ...config,
      profile: { ...config.profile },
    },
    totalGames: matches.length,
    p1WinRate: p1Wins / resolved,
    drawRate: draws / resolved,
    stalledRate: stalled / Math.max(1, matches.length),
    avgActions: matches.reduce((sum, match) => sum + match.actions, 0) / Math.max(1, matches.length),
    p50Actions,
    p90Actions,
    matches,
    matchups: summarizeMatchups(matches),
    heroes: summarizeHeroes(matches),
    abilityUses,
    patternEvents,
    conversions: conversionSummaries(matches),
    anomalies,
  };
}

export function replayBalanceMatch(result: BalanceRunResult, matchId: number): BalanceReplay | null {
  const match = result.matches.find((candidate) => candidate.id === matchId);
  if (!match) return null;
  const replay = simulateOneMatch({
    id: match.id,
    seed: match.seed,
    p1Hero: match.p1Hero,
    p2Hero: match.p2Hero,
  }, result.config, true);
  return {
    match: { ...match },
    actions: replay.traces,
    snapshots: replay.snapshots ?? [],
  };
}

export function createTakeoverSession(
  replay: BalanceReplay,
  snapshotIndex: number,
): GameSession | null {
  const snapshot = replay.snapshots[snapshotIndex];
  if (!snapshot || snapshot.match.status !== 'playing' || snapshot.match.phase !== 'player') return null;
  return {
    config: {
      mode: { kind: 'free-battle' },
      playerHeroId: replay.match.p1Hero,
      cpuHeroId: replay.match.p2Hero,
      cpuDifficulty: 'normal',
    },
    state: cloneActionState(snapshot),
  };
}

export function compactBoard(board: Board): string {
  return board.map((row) => row.join('')).join('/');
}

export function actionTraceKey(trace: BalanceActionTrace): string {
  return `${trace.actor}:${trace.kind}:${trace.abilityId ?? 'place'}:${positionKey(trace.at)}`;
}
