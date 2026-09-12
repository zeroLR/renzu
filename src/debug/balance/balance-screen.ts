import { Container, Graphics } from 'pixi.js';
import { actionButton, label, pageTitle, surface } from '../../design-system/components/primitives';
import { color, layout, spacing, type } from '../../design-system/tokens/tokens';
import { heroIds, type HeroId } from '../../heroes/domain/hero-definition';
import type { BalanceLabController, BalanceLabSnapshot, BalanceResultsTab, TunableProfileKey } from './balance-controller';

export type BalanceLabView = 'setup' | 'results' | 'inspect';

export interface BalanceLabScreenActions {
  onBack(): void;
  onChange(): void;
  onRunComplete(): void;
  onInspect(): void;
  onTakeover(): void;
}

const pct = (value: number): string => `${Math.round(value * 100)}%`;
const number = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(2);
const heroName = (heroId: HeroId): string => heroId.toUpperCase();

function backButton(root: Container, onBack: () => void): void {
  const back = actionButton('‹', 48, 48, onBack);
  back.position.set(layout.horizontalInset, 24);
  root.addChild(back);
}

function addSectionLabel(root: Container, text: string, y: number): void {
  const node = label(text.toUpperCase(), type.caption, color.inkSoft, '700');
  node.position.set(layout.horizontalInset, y);
  root.addChild(node);
}

function addChoiceRow(
  root: Container,
  values: readonly string[],
  selected: string,
  y: number,
  onSelect: (value: string) => void,
): void {
  const width = (layout.contentWidth - spacing.sm * (values.length - 1)) / values.length;
  values.forEach((value, index) => {
    const button = actionButton(value.toUpperCase(), width, 48, () => onSelect(value), selected === value);
    button.position.set(layout.horizontalInset + index * (width + spacing.sm), y);
    root.addChild(button);
  });
}

function addStepper(
  root: Container,
  titleText: string,
  value: string,
  y: number,
  onMinus: () => void,
  onPlus: () => void,
): void {
  const titleNode = label(titleText.toUpperCase(), 10, color.inkSoft, '700');
  titleNode.position.set(layout.horizontalInset, y + 17);
  const minus = actionButton('−', 48, 48, onMinus);
  minus.position.set(210, y);
  const valueNode = label(value, type.body, color.ink, '700');
  valueNode.anchor.set(0.5);
  valueNode.position.set(286, y + 24);
  const plus = actionButton('+', 48, 48, onPlus);
  plus.position.set(318, y);
  root.addChild(titleNode, minus, valueNode, plus);
}

function addProfileCell(
  root: Container,
  titleText: string,
  value: string,
  x: number,
  y: number,
  onMinus: () => void,
  onPlus: () => void,
): void {
  const panel = surface(164, 64, false);
  panel.position.set(x, y);
  const name = label(titleText.toUpperCase(), 9, color.inkSoft, '700');
  name.position.set(x + 10, y + 8);
  const minus = actionButton('−', 38, 34, onMinus);
  minus.position.set(x + 8, y + 26);
  const valueNode = label(value, 11, color.ink, '700');
  valueNode.anchor.set(0.5);
  valueNode.position.set(x + 82, y + 43);
  const plus = actionButton('+', 38, 34, onPlus);
  plus.position.set(x + 118, y + 26);
  root.addChild(panel, name, minus, valueNode, plus);
}

const PROFILE_ROWS: readonly [TunableProfileKey, string, number][] = [
  ['candidateWidth', 'Candidates', 1],
  ['optimalMoveRate', 'Optimal rate', 0.05],
  ['attackWeight', 'Attack', 0.05],
  ['defenseWeight', 'Defense', 0.05],
  ['abilityWeight', 'Ability', 0.05],
  ['blunderTolerance', 'Blunder', 0.02],
];

function renderSetup(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  backButton(root, actions.onBack);
  const heading = pageTitle('DEBUG · BALANCE LAB', 'CPU self-play', 'Run reproducible matchup experiments.');
  heading.position.set(layout.horizontalInset, 88);
  root.addChild(heading);

  addSectionLabel(root, 'Scope', 176);
  addChoiceRow(root, ['pair', 'matrix'], snapshot.config.scope, 198, (value) => {
    controller.setScope(value as 'pair' | 'matrix');
    actions.onChange();
  });

  if (snapshot.config.scope === 'pair') {
    addSectionLabel(root, 'Hero A', 258);
    addChoiceRow(root, heroIds, snapshot.config.heroA, 280, (value) => {
      controller.setHeroA(value as HeroId);
      actions.onChange();
    });
    addSectionLabel(root, 'Hero B', 338);
    addChoiceRow(root, heroIds, snapshot.config.heroB, 360, (value) => {
      controller.setHeroB(value as HeroId);
      actions.onChange();
    });
  } else {
    const note = surface(layout.contentWidth, 88, false);
    note.position.set(layout.horizontalInset, 266);
    const titleNode = label('FULL 3 × 3 MATRIX', type.body, color.gold, '700');
    titleNode.position.set(40, 284);
    const body = label('Vanguard · Arcanist · Shade\nAll directional seat matchups.', 11, color.inkSoft, '500');
    body.position.set(40, 312);
    root.addChild(note, titleNode, body);
  }

  const parameterY = snapshot.config.scope === 'pair' ? 430 : 374;
  addStepper(root, 'Games / seat', String(snapshot.config.gamesPerSeat), parameterY, () => {
    controller.adjustGames(-10); actions.onChange();
  }, () => {
    controller.adjustGames(10); actions.onChange();
  });
  addStepper(root, 'Seed', String(snapshot.config.seed), parameterY + 54, () => {
    controller.adjustSeed(-1); actions.onChange();
  }, () => {
    controller.adjustSeed(1); actions.onChange();
  });
  addStepper(root, 'Max actions', String(snapshot.config.maxActions), parameterY + 108, () => {
    controller.adjustMaxActions(-10); actions.onChange();
  }, () => {
    controller.adjustMaxActions(10); actions.onChange();
  });

  const swap = actionButton(snapshot.config.swapSeats ? 'SEAT SWAP · ON' : 'SEAT SWAP · OFF', layout.contentWidth, 44, () => {
    controller.setSwapSeats(!snapshot.config.swapSeats);
    actions.onChange();
  }, snapshot.config.swapSeats);
  swap.position.set(layout.horizontalInset, parameterY + 162);
  root.addChild(swap);

  const profileY = parameterY + 220;
  addSectionLabel(root, 'CPU evaluator', profileY);
  PROFILE_ROWS.forEach(([key, titleText, step], index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    addProfileCell(
      root,
      titleText,
      number(Number(snapshot.config.profile[key])),
      layout.horizontalInset + col * 178,
      profileY + 22 + row * 70,
      () => { controller.adjustProfile(key, -step); actions.onChange(); },
      () => { controller.adjustProfile(key, step); actions.onChange(); },
    );
  });

  const controlsY = profileY + 238;
  const reset = actionButton('RESET CPU', 112, 52, () => { controller.resetProfile(); actions.onChange(); });
  reset.position.set(layout.horizontalInset, controlsY);
  const runText = snapshot.running
    ? `RUNNING ${snapshot.progress?.completed ?? 0} / ${snapshot.progress?.total ?? '…'}`
    : 'RUN SIMULATION';
  const run = actionButton(runText, 218, 52, () => {
    if (snapshot.running) return;
    void controller.run(actions.onChange).then((result) => {
      if (result) actions.onRunComplete();
    });
  }, true);
  run.position.set(148, controlsY);
  if (snapshot.running) run.alpha = 0.65;
  root.addChild(reset, run);
}

function statCard(root: Container, x: number, y: number, titleText: string, valueText: string): void {
  const card = surface(164, 76, false);
  card.position.set(x, y);
  const titleNode = label(titleText.toUpperCase(), 9, color.muted, '700');
  titleNode.position.set(x + 12, y + 12);
  const valueNode = label(valueText, 22, color.ink, '700');
  valueNode.position.set(x + 12, y + 34);
  root.addChild(card, titleNode, valueNode);
}

function renderOverview(root: Container, snapshot: BalanceLabSnapshot): void {
  const result = snapshot.result;
  if (!result) return;
  statCard(root, 24, 238, 'P1 win', pct(result.p1WinRate));
  statCard(root, 202, 238, 'Draw', pct(result.drawRate));
  statCard(root, 24, 326, 'Avg actions', result.avgActions.toFixed(1));
  statCard(root, 202, 326, 'P90 actions', String(result.p90Actions));

  addSectionLabel(root, 'Hero outcomes', 424);
  result.heroes.forEach((hero, index) => {
    const y = 448 + index * 34;
    const name = label(heroName(hero.heroId), 11, color.ink, '700');
    name.position.set(32, y);
    const detail = label(`${pct(hero.winRate)} WIN · ${hero.abilityUsesPerGame.toFixed(1)} ABILITY/G`, 10, color.inkSoft, '600');
    detail.anchor.set(1, 0);
    detail.position.set(358, y);
    root.addChild(name, detail);
  });

  addSectionLabel(root, 'Conversions', 558);
  if (!result.conversions.length) {
    const empty = label('NO TOPOLOGY ABILITY CONVERSIONS RECORDED', 10, color.muted, '600');
    empty.position.set(32, 584);
    root.addChild(empty);
  } else {
    result.conversions.slice(0, 4).forEach((item, index) => {
      const y = 584 + index * 28;
      const textNode = label(`${item.abilityId.toUpperCase()}  ${item.uses} USES`, 10, color.inkSoft, '600');
      textNode.position.set(32, y);
      const rate = label(`${pct(item.rate)} WIN ≤2 OWN ACTIONS`, 10, item.rate >= 0.6 ? color.danger : color.gold, '700');
      rate.anchor.set(1, 0);
      rate.position.set(358, y);
      root.addChild(textNode, rate);
    });
  }
}

function renderMatchups(root: Container, snapshot: BalanceLabSnapshot): void {
  const result = snapshot.result;
  if (!result) return;
  addSectionLabel(root, 'Directional matchups', 238);
  result.matchups.slice(0, 10).forEach((matchup, index) => {
    const y = 264 + index * 46;
    const row = surface(layout.contentWidth, 38, false);
    row.position.set(layout.horizontalInset, y);
    const name = label(`${heroName(matchup.p1Hero)} → ${heroName(matchup.p2Hero)}`, 10, color.ink, '700');
    name.position.set(34, y + 12);
    const stats = label(`${pct(matchup.p1WinRate)} · ${matchup.avgActions.toFixed(1)}A`, 10, color.inkSoft, '700');
    stats.anchor.set(1, 0);
    stats.position.set(356, y + 12);
    root.addChild(row, name, stats);
  });
}

function renderAnomalies(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  const result = snapshot.result;
  if (!result) return;
  addSectionLabel(root, 'Flagged matches', 238);
  if (!result.anomalies.length) {
    const empty = label('NO FLAGGED MATCHES', type.body, color.muted, '600');
    empty.position.set(32, 278);
    root.addChild(empty);
    return;
  }

  result.anomalies.slice(0, 7).forEach((match, index) => {
    const y = 266 + index * 64;
    const row = surface(layout.contentWidth, 56, true);
    row.position.set(layout.horizontalInset, y);
    const titleNode = label(`#${match.id}  ${heroName(match.p1Hero)} vs ${heroName(match.p2Hero)}`, 10, color.ink, '700');
    titleNode.position.set(36, y + 10);
    const flags = label(match.flags.slice(0, 2).join(' · ').toUpperCase(), 9, color.danger, '700');
    flags.position.set(36, y + 31);
    const inspect = actionButton('VIEW', 72, 40, () => {
      if (controller.inspectMatch(match.id)) actions.onInspect();
    }, true);
    inspect.position.set(286, y + 8);
    root.addChild(row, titleNode, flags, inspect);
  });
}

function renderResults(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  backButton(root, actions.onBack);
  const heading = pageTitle('DEBUG · BALANCE LAB', 'Simulation results', `${snapshot.result?.totalGames ?? 0} deterministic matches`);
  heading.position.set(layout.horizontalInset, 88);
  root.addChild(heading);

  const tabs: readonly BalanceResultsTab[] = ['overview', 'matchups', 'anomalies'];
  addChoiceRow(root, tabs, snapshot.resultsTab, 174, (value) => {
    controller.setResultsTab(value as BalanceResultsTab);
    actions.onChange();
  });

  if (snapshot.resultsTab === 'overview') renderOverview(root, snapshot);
  if (snapshot.resultsTab === 'matchups') renderMatchups(root, snapshot);
  if (snapshot.resultsTab === 'anomalies') renderAnomalies(root, controller, snapshot, actions);

  const rerun = actionButton('RERUN SAME CONFIG', 166, 48, () => {
    void controller.run(actions.onChange).then((result) => {
      if (result) actions.onRunComplete();
    });
  });
  rerun.position.set(24, 772);
  const setup = actionButton('EDIT SETUP', 166, 48, actions.onBack, true);
  setup.position.set(200, 772);
  root.addChild(rerun, setup);
}

function renderBoard(root: Container, board: readonly (readonly number[])[], x: number, y: number, size: number): void {
  const panel = new Graphics().roundRect(x - 8, y - 8, size + 16, size + 16, 12).fill(color.surface).stroke({ color: color.edge, width: 1 });
  root.addChild(panel);
  const spacingPx = size / 8;
  const grid = new Graphics();
  for (let index = 0; index < 9; index += 1) {
    grid.moveTo(x + index * spacingPx, y).lineTo(x + index * spacingPx, y + size);
    grid.moveTo(x, y + index * spacingPx).lineTo(x + size, y + index * spacingPx);
  }
  grid.stroke({ color: 0x3a3e47, width: 1 });
  root.addChild(grid);

  board.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
    if (cell === 0) return;
    const stone = new Graphics()
      .circle(x + colIndex * spacingPx, y + rowIndex * spacingPx, Math.max(5, spacingPx * 0.32))
      .fill(cell === 1 ? 0xe8ddc3 : 0x747c91)
      .stroke({ color: cell === 1 ? 0xf6f0e1 : 0xaab2c4, width: 1 });
    root.addChild(stone);
  }));
}

function renderInspector(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  backButton(root, actions.onBack);
  const replay = snapshot.replay;
  if (!replay) return;
  const state = replay.snapshots[snapshot.replayStep];
  const trace = snapshot.replayStep > 0 ? replay.actions[snapshot.replayStep - 1] : null;
  const heading = pageTitle('DEBUG · MATCH INSPECTOR', `Match #${replay.match.id}`, `${heroName(replay.match.p1Hero)} vs ${heroName(replay.match.p2Hero)} · seed ${replay.match.seed}`);
  heading.position.set(layout.horizontalInset, 88);
  root.addChild(heading);

  const flag = label(replay.match.flags.length ? replay.match.flags.join(' · ').toUpperCase() : 'UNFLAGGED', 9, replay.match.flags.length ? color.danger : color.muted, '700');
  flag.position.set(layout.horizontalInset, 166);
  root.addChild(flag);

  renderBoard(root, state.match.board, 59, 210, 272);

  const status = surface(layout.contentWidth, 94, false);
  status.position.set(layout.horizontalInset, 510);
  const step = label(`STEP ${snapshot.replayStep} / ${replay.snapshots.length - 1} · TURN ${state.match.turn} · ${state.match.phase.toUpperCase()}`, 10, color.gold, '700');
  step.position.set(36, 524);
  const action = trace
    ? `${trace.heroId.toUpperCase()} · ${trace.abilityId?.toUpperCase() ?? 'PLACE'} · SCORE ${Math.round(trace.score)}`
    : 'INITIAL POSITION';
  const actionNode = label(action, 10, color.ink, '700');
  actionNode.position.set(36, 550);
  const reasons = label(trace?.reasons.slice(0, 3).join(' · ') ?? '—', 9, color.inkSoft, '500');
  reasons.position.set(36, 576);
  root.addChild(status, step, actionNode, reasons);

  const prev = actionButton('‹ PREV', 104, 48, () => { controller.moveReplayStep(-1); actions.onChange(); });
  prev.position.set(24, 626);
  const next = actionButton('NEXT ›', 104, 48, () => { controller.moveReplayStep(1); actions.onChange(); });
  next.position.set(138, 626);
  const takeover = actionButton('TAKE OVER', 114, 48, () => {
    if (controller.createTakeover()) actions.onTakeover();
  }, true);
  takeover.position.set(252, 626);
  root.addChild(prev, next, takeover);

  const hint = label('TAKE OVER jumps to the nearest live P1 turn.\nYou play P1; P2 keeps the experiment CPU profile.', 10, color.inkSoft, '500');
  hint.position.set(30, 696);
  hint.style.lineHeight = 18;
  root.addChild(hint);
}

export function renderBalanceLabScreen(
  root: Container,
  controller: BalanceLabController,
  view: BalanceLabView,
  actions: BalanceLabScreenActions,
): void {
  const snapshot = controller.snapshot();
  if (view === 'inspect' && snapshot.replay) {
    renderInspector(root, controller, snapshot, actions);
    return;
  }
  if (view === 'results' && snapshot.result) {
    renderResults(root, controller, snapshot, actions);
    return;
  }
  renderSetup(root, controller, snapshot, actions);
}
