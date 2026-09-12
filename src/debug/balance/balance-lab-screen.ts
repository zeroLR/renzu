import { Container, Graphics } from 'pixi.js';
import { actionButton, label, pageTitle, surface } from '../../design-system/components/primitives';
import { color, layout, spacing, type } from '../../design-system/tokens/tokens';
import { heroIds, type HeroId } from '../../heroes/domain/hero-definition';
import type { BalanceLabController, BalanceLabSnapshot, BalanceResultsTab, TunableProfileKey } from './balance-controller';

export type BalanceLabView = 'setup' | 'cpu' | 'results' | 'inspect';

export interface BalanceLabScreenActions {
  onBack(): void;
  onChange(): void;
  onCpuTuning(): void;
  onRunComplete(): void;
  onInspect(): void;
  onTakeover(): void;
}

const pct = (value: number): string => `${Math.round(value * 100)}%`;
const displayNumber = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(2);

function addBack(root: Container, onBack: () => void): void {
  const button = actionButton('‹', 48, 48, onBack);
  button.position.set(layout.horizontalInset, 24);
  root.addChild(button);
}

function section(root: Container, text: string, y: number): void {
  const node = label(text.toUpperCase(), 10, color.inkSoft, '700');
  node.position.set(layout.horizontalInset, y);
  root.addChild(node);
}

function choices(root: Container, values: readonly string[], selected: string, y: number, onSelect: (value: string) => void): void {
  const width = (layout.contentWidth - spacing.sm * (values.length - 1)) / values.length;
  values.forEach((value, index) => {
    const button = actionButton(value.toUpperCase(), width, 48, () => onSelect(value), selected === value);
    button.position.set(layout.horizontalInset + index * (width + spacing.sm), y);
    root.addChild(button);
  });
}

function stepper(root: Container, titleText: string, value: string, y: number, minus: () => void, plus: () => void): void {
  const titleNode = label(titleText.toUpperCase(), 10, color.inkSoft, '700');
  titleNode.position.set(layout.horizontalInset, y + 17);
  const minusButton = actionButton('−', 48, 48, minus);
  minusButton.position.set(210, y);
  const valueNode = label(value, type.body, color.ink, '700');
  valueNode.anchor.set(0.5);
  valueNode.position.set(286, y + 24);
  const plusButton = actionButton('+', 48, 48, plus);
  plusButton.position.set(318, y);
  root.addChild(titleNode, minusButton, valueNode, plusButton);
}

function profileCell(root: Container, titleText: string, value: string, x: number, y: number, minus: () => void, plus: () => void): void {
  const panel = surface(164, 82, false);
  panel.position.set(x, y);
  const name = label(titleText.toUpperCase(), 9, color.inkSoft, '700');
  name.position.set(x + 10, y + 10);
  const minusButton = actionButton('−', 48, 44, minus);
  minusButton.position.set(x + 8, y + 30);
  const valueNode = label(value, 11, color.ink, '700');
  valueNode.anchor.set(0.5);
  valueNode.position.set(x + 82, y + 52);
  const plusButton = actionButton('+', 48, 44, plus);
  plusButton.position.set(x + 108, y + 30);
  root.addChild(panel, name, minusButton, valueNode, plusButton);
}

function runButton(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions, y: number): void {
  const text = snapshot.running
    ? `RUNNING ${snapshot.progress?.completed ?? 0}/${snapshot.progress?.total ?? '…'}`
    : 'RUN SIMULATION';
  const button = actionButton(text, layout.contentWidth, 56, () => {
    if (snapshot.running) return;
    void controller.run(actions.onChange).then((result) => {
      if (result) actions.onRunComplete();
    });
  }, true);
  button.position.set(layout.horizontalInset, y);
  if (snapshot.running) button.alpha = 0.65;
  root.addChild(button);
}

function renderSetup(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  addBack(root, actions.onBack);
  const heading = pageTitle('DEBUG · BALANCE LAB', 'Experiment setup', 'Headless CPU vs CPU on the real combat pipeline.');
  heading.position.set(layout.horizontalInset, 88);
  root.addChild(heading);

  section(root, 'Scope', 176);
  choices(root, ['pair', 'matrix'], snapshot.config.scope, 198, (value) => {
    controller.setScope(value as 'pair' | 'matrix'); actions.onChange();
  });

  if (snapshot.config.scope === 'pair') {
    section(root, 'Hero A', 258);
    choices(root, heroIds, snapshot.config.heroA, 280, (value) => {
      controller.setHeroA(value as HeroId); actions.onChange();
    });
    section(root, 'Hero B', 338);
    choices(root, heroIds, snapshot.config.heroB, 360, (value) => {
      controller.setHeroB(value as HeroId); actions.onChange();
    });
  } else {
    const panel = surface(layout.contentWidth, 94, false);
    panel.position.set(layout.horizontalInset, 264);
    const titleNode = label('FULL 3 × 3 MATRIX', type.body, color.gold, '700');
    titleNode.position.set(40, 284);
    const detail = label('All Vanguard / Arcanist / Shade\ndirectional seat matchups.', 11, color.inkSoft, '500');
    detail.position.set(40, 314);
    root.addChild(panel, titleNode, detail);
  }

  const y = snapshot.config.scope === 'pair' ? 430 : 382;
  stepper(root, 'Games / seat', String(snapshot.config.gamesPerSeat), y, () => {
    controller.adjustGames(-10); actions.onChange();
  }, () => { controller.adjustGames(10); actions.onChange(); });
  stepper(root, 'Seed', String(snapshot.config.seed), y + 56, () => {
    controller.adjustSeed(-1); actions.onChange();
  }, () => { controller.adjustSeed(1); actions.onChange(); });
  stepper(root, 'Max actions', String(snapshot.config.maxActions), y + 112, () => {
    controller.adjustMaxActions(-10); actions.onChange();
  }, () => { controller.adjustMaxActions(10); actions.onChange(); });

  const swap = actionButton(snapshot.config.swapSeats ? 'SEAT SWAP · ON' : 'SEAT SWAP · OFF', layout.contentWidth, 48, () => {
    controller.setSwapSeats(!snapshot.config.swapSeats); actions.onChange();
  }, snapshot.config.swapSeats);
  swap.position.set(layout.horizontalInset, y + 172);
  root.addChild(swap);

  const cpu = actionButton('CPU TUNING', layout.contentWidth, 48, actions.onCpuTuning);
  cpu.position.set(layout.horizontalInset, y + 232);
  root.addChild(cpu);
  runButton(root, controller, snapshot, actions, y + 292);
}

const PROFILE_FIELDS: readonly [TunableProfileKey, string, number][] = [
  ['candidateWidth', 'Candidates', 1],
  ['optimalMoveRate', 'Optimal rate', 0.05],
  ['attackWeight', 'Attack weight', 0.05],
  ['defenseWeight', 'Defense weight', 0.05],
  ['abilityWeight', 'Ability weight', 0.05],
  ['blunderTolerance', 'Blunder tol.', 0.02],
];

function renderCpu(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  addBack(root, actions.onBack);
  const heading = pageTitle('DEBUG · BALANCE LAB', 'CPU tuning', 'Shared evaluator profile for both seats.');
  heading.position.set(layout.horizontalInset, 88);
  root.addChild(heading);

  PROFILE_FIELDS.forEach(([key, titleText, delta], index) => {
    const row = Math.floor(index / 2);
    const column = index % 2;
    profileCell(
      root,
      titleText,
      displayNumber(Number(snapshot.config.profile[key])),
      layout.horizontalInset + column * 178,
      190 + row * 96,
      () => { controller.adjustProfile(key, -delta); actions.onChange(); },
      () => { controller.adjustProfile(key, delta); actions.onChange(); },
    );
  });

  const explanation = surface(layout.contentWidth, 116, false);
  explanation.position.set(layout.horizontalInset, 500);
  const titleNode = label('INTERPRETATION', 10, color.gold, '700');
  titleNode.position.set(38, 516);
  const detail = label('Weights change ranking preference. Optimal rate and\nblunder tolerance control decision variance. The same\nprofile is used on both sides to isolate hero effects.', 10, color.inkSoft, '500');
  detail.position.set(38, 542);
  detail.style.lineHeight = 17;
  root.addChild(explanation, titleNode, detail);

  const reset = actionButton('RESET NORMAL', layout.contentWidth, 48, () => {
    controller.resetProfile(); actions.onChange();
  });
  reset.position.set(layout.horizontalInset, 636);
  root.addChild(reset);
  runButton(root, controller, snapshot, actions, 700);
}

function stat(root: Container, x: number, y: number, titleText: string, value: string): void {
  const card = surface(164, 76, false);
  card.position.set(x, y);
  const name = label(titleText.toUpperCase(), 9, color.muted, '700');
  name.position.set(x + 12, y + 12);
  const valueNode = label(value, 22, color.ink, '700');
  valueNode.position.set(x + 12, y + 34);
  root.addChild(card, name, valueNode);
}

function renderOverview(root: Container, snapshot: BalanceLabSnapshot): void {
  const result = snapshot.result;
  if (!result) return;
  stat(root, 24, 238, 'P1 win', pct(result.p1WinRate));
  stat(root, 202, 238, 'Draw', pct(result.drawRate));
  stat(root, 24, 326, 'Avg actions', result.avgActions.toFixed(1));
  stat(root, 202, 326, 'P90 actions', String(result.p90Actions));

  section(root, 'Hero outcomes', 424);
  result.heroes.forEach((hero, index) => {
    const y = 450 + index * 34;
    const name = label(hero.heroId.toUpperCase(), 11, color.ink, '700');
    name.position.set(32, y);
    const metrics = label(`${pct(hero.winRate)} WIN · ${hero.abilityUsesPerGame.toFixed(1)} ABILITY/G`, 10, color.inkSoft, '600');
    metrics.anchor.set(1, 0);
    metrics.position.set(358, y);
    root.addChild(name, metrics);
  });

  section(root, 'Conversions', 568);
  result.conversions.slice(0, 4).forEach((item, index) => {
    const y = 594 + index * 28;
    const left = label(`${item.abilityId.toUpperCase()} · ${item.uses} USES`, 10, color.inkSoft, '600');
    left.position.set(32, y);
    const right = label(`${pct(item.rate)} WIN ≤2`, 10, item.rate >= 0.6 ? color.danger : color.gold, '700');
    right.anchor.set(1, 0);
    right.position.set(358, y);
    root.addChild(left, right);
  });
}

function renderMatchups(root: Container, snapshot: BalanceLabSnapshot): void {
  const result = snapshot.result;
  if (!result) return;
  section(root, 'Directional matchups', 238);
  result.matchups.slice(0, 10).forEach((item, index) => {
    const y = 264 + index * 46;
    const row = surface(layout.contentWidth, 38, false);
    row.position.set(layout.horizontalInset, y);
    const name = label(`${item.p1Hero.toUpperCase()} → ${item.p2Hero.toUpperCase()}`, 10, color.ink, '700');
    name.position.set(34, y + 12);
    const metrics = label(`${pct(item.p1WinRate)} · ${item.avgActions.toFixed(1)}A`, 10, color.inkSoft, '700');
    metrics.anchor.set(1, 0);
    metrics.position.set(356, y + 12);
    root.addChild(row, name, metrics);
  });
}

function renderAnomalies(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  const result = snapshot.result;
  if (!result) return;
  section(root, 'Flagged matches', 238);
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
    const titleNode = label(`#${match.id} · ${match.p1Hero.toUpperCase()} vs ${match.p2Hero.toUpperCase()}`, 10, color.ink, '700');
    titleNode.position.set(36, y + 10);
    const flags = label(match.flags.slice(0, 2).join(' · ').toUpperCase(), 9, color.danger, '700');
    flags.position.set(36, y + 31);
    const view = actionButton('VIEW', 72, 40, () => {
      if (controller.inspectMatch(match.id)) actions.onInspect();
    }, true);
    view.position.set(286, y + 8);
    root.addChild(row, titleNode, flags, view);
  });
}

function renderResults(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  addBack(root, actions.onBack);
  const heading = pageTitle('DEBUG · BALANCE LAB', 'Simulation results', `${snapshot.result?.totalGames ?? 0} deterministic matches`);
  heading.position.set(layout.horizontalInset, 88);
  root.addChild(heading);

  const tabs: readonly BalanceResultsTab[] = ['overview', 'matchups', 'anomalies'];
  choices(root, tabs, snapshot.resultsTab, 174, (value) => {
    controller.setResultsTab(value as BalanceResultsTab); actions.onChange();
  });

  if (snapshot.resultsTab === 'overview') renderOverview(root, snapshot);
  if (snapshot.resultsTab === 'matchups') renderMatchups(root, snapshot);
  if (snapshot.resultsTab === 'anomalies') renderAnomalies(root, controller, snapshot, actions);

  const rerun = actionButton('RERUN', 166, 48, () => {
    void controller.run(actions.onChange).then((result) => { if (result) actions.onRunComplete(); });
  });
  rerun.position.set(24, 772);
  const setup = actionButton('EDIT SETUP', 166, 48, actions.onBack, true);
  setup.position.set(200, 772);
  root.addChild(rerun, setup);
}

function drawBoard(root: Container, board: readonly (readonly number[])[], x: number, y: number, size: number): void {
  const panel = new Graphics().roundRect(x - 8, y - 8, size + 16, size + 16, 12).fill(color.surface).stroke({ color: color.edge, width: 1 });
  root.addChild(panel);
  const unit = size / 8;
  const grid = new Graphics();
  for (let index = 0; index < 9; index += 1) {
    grid.moveTo(x + index * unit, y).lineTo(x + index * unit, y + size);
    grid.moveTo(x, y + index * unit).lineTo(x + size, y + index * unit);
  }
  grid.stroke({ color: 0x3a3e47, width: 1 });
  root.addChild(grid);
  board.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
    if (cell === 0) return;
    const stone = new Graphics().circle(x + colIndex * unit, y + rowIndex * unit, Math.max(5, unit * 0.31))
      .fill(cell === 1 ? 0xe8ddc3 : 0x747c91)
      .stroke({ color: cell === 1 ? 0xf6f0e1 : 0xaab2c4, width: 1 });
    root.addChild(stone);
  }));
}

function renderInspect(root: Container, controller: BalanceLabController, snapshot: BalanceLabSnapshot, actions: BalanceLabScreenActions): void {
  addBack(root, actions.onBack);
  const replay = snapshot.replay;
  if (!replay) return;
  const state = replay.snapshots[snapshot.replayStep];
  const trace = snapshot.replayStep > 0 ? replay.actions[snapshot.replayStep - 1] : null;
  const heading = pageTitle('DEBUG · MATCH INSPECTOR', `Match #${replay.match.id}`, `${replay.match.p1Hero.toUpperCase()} vs ${replay.match.p2Hero.toUpperCase()} · seed ${replay.match.seed}`);
  heading.position.set(layout.horizontalInset, 88);
  root.addChild(heading);
  const flags = label(replay.match.flags.join(' · ').toUpperCase() || 'UNFLAGGED', 9, replay.match.flags.length ? color.danger : color.muted, '700');
  flags.position.set(layout.horizontalInset, 166);
  root.addChild(flags);

  drawBoard(root, state.match.board, 59, 210, 272);

  const detail = surface(layout.contentWidth, 94, false);
  detail.position.set(layout.horizontalInset, 510);
  const step = label(`STEP ${snapshot.replayStep}/${replay.snapshots.length - 1} · TURN ${state.match.turn} · ${state.match.phase.toUpperCase()}`, 10, color.gold, '700');
  step.position.set(36, 524);
  const actionText = trace ? `${trace.heroId.toUpperCase()} · ${trace.abilityId?.toUpperCase() ?? 'PLACE'} · SCORE ${Math.round(trace.score)}` : 'INITIAL POSITION';
  const action = label(actionText, 10, color.ink, '700');
  action.position.set(36, 550);
  const reasons = label(trace?.reasons.slice(0, 3).join(' · ') ?? '—', 9, color.inkSoft, '500');
  reasons.position.set(36, 576);
  root.addChild(detail, step, action, reasons);

  const prev = actionButton('‹ PREV', 104, 48, () => { controller.moveReplayStep(-1); actions.onChange(); });
  prev.position.set(24, 626);
  const next = actionButton('NEXT ›', 104, 48, () => { controller.moveReplayStep(1); actions.onChange(); });
  next.position.set(138, 626);
  const takeover = actionButton('TAKE OVER', 114, 48, () => { if (controller.createTakeover()) actions.onTakeover(); }, true);
  takeover.position.set(252, 626);
  root.addChild(prev, next, takeover);

  const hint = label('TAKE OVER uses the nearest live P1 turn.\nYou play P1; P2 keeps the experiment CPU profile.', 10, color.inkSoft, '500');
  hint.position.set(30, 698);
  hint.style.lineHeight = 18;
  root.addChild(hint);
}

export function renderBalanceLabScreen(root: Container, controller: BalanceLabController, view: BalanceLabView, actions: BalanceLabScreenActions): void {
  const snapshot = controller.snapshot();
  if (view === 'cpu') return renderCpu(root, controller, snapshot, actions);
  if (view === 'results' && snapshot.result) return renderResults(root, controller, snapshot, actions);
  if (view === 'inspect' && snapshot.replay) return renderInspect(root, controller, snapshot, actions);
  return renderSetup(root, controller, snapshot, actions);
}
