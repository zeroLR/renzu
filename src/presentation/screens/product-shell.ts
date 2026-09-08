import { Container, Graphics } from 'pixi.js';
import type { ProductFlow } from '../../app/game-session/product-flow';
import type { AppRoute, AppRouter } from '../../app/routing/router';
import { actionButton, label, pageTitle, surface } from '../../design-system/components/primitives';
import { color, layout, spacing, type } from '../../design-system/tokens/tokens';
import { heroPresentation } from '../../heroes/content/hero-presentation';
import { heroIds, type HeroId } from '../../heroes/domain/hero-definition';
import { EASY_STORY_ENCOUNTERS, isStoryEncounterUnlocked } from '../../modes/story/story-content';
import { renderBattleScreen } from './battle-screen';

export interface ProductShell {
  root: Container;
  render(route?: AppRoute): void;
  resize(width: number, height: number): void;
}

const heroLabel = (heroId: HeroId): string => heroPresentation[heroId].displayName;

export function createProductShell(router: AppRouter, flow: ProductFlow): ProductShell {
  const viewport = new Container();
  const content = new Container();
  viewport.addChild(content);

  const navigate = (route: AppRoute): void => {
    router.navigate(route);
    render();
  };

  const leaveBattle = (): void => {
    flow.clearSession();
    router.back();
    render();
  };

  const addBackButton = (): void => {
    const back = actionButton('‹', 48, 48, () => {
      if (router.current().screen === 'battle') flow.clearSession();
      router.back();
      render();
    });
    back.position.set(layout.horizontalInset, 24);
    content.addChild(back);
  };

  const addBrand = (): void => {
    const brand = label('RENZU', type.caption, color.gold, '700');
    brand.style.letterSpacing = 4;
    brand.position.set(layout.horizontalInset, 28);
    content.addChild(brand);
  };

  const renderHome = (): void => {
    addBrand();
    const mark = label('連', 92, color.ink, '600');
    mark.anchor.set(0.5);
    mark.position.set(layout.referenceWidth / 2, 210);
    const titleNode = label('RENZU', type.display, color.ink, '700');
    titleNode.anchor.set(0.5);
    titleNode.style.letterSpacing = 8;
    titleNode.position.set(layout.referenceWidth / 2, 304);
    const subtitle = label('HERO TACTICS · FIVE IN A ROW', type.caption, color.inkSoft, '600');
    subtitle.anchor.set(0.5);
    subtitle.style.letterSpacing = 2;
    subtitle.position.set(layout.referenceWidth / 2, 350);
    const play = actionButton('PLAY', layout.contentWidth, 64, () => navigate({ screen: 'play' }), true);
    play.position.set(layout.horizontalInset, 498);
    const heroes = actionButton('HEROES', layout.contentWidth, 56, () => navigate({ screen: 'heroes' }));
    heroes.position.set(layout.horizontalInset, 578);
    const note = label('Board decisions remain the authority.', type.caption, color.muted, '500');
    note.anchor.set(0.5);
    note.position.set(layout.referenceWidth / 2, 742);
    content.addChild(mark, titleNode, subtitle, play, heroes, note);
  };

  const modeCard = (y: number, eyebrow: string, titleText: string, description: string, action: string, onPress: () => void, locked = false): void => {
    const card = surface(layout.contentWidth, 164, true);
    card.position.set(layout.horizontalInset, y);
    const eyebrowNode = label(eyebrow, type.caption, locked ? color.muted : color.gold, '700');
    eyebrowNode.position.set(layout.horizontalInset + spacing.md, y + 18);
    const titleNode = label(titleText, type.heading, locked ? color.muted : color.ink, '700');
    titleNode.position.set(layout.horizontalInset + spacing.md, y + 43);
    const body = label(description, type.caption, color.inkSoft, '400');
    body.position.set(layout.horizontalInset + spacing.md, y + 73);
    const button = actionButton(action, 132, 44, onPress, !locked);
    button.position.set(layout.horizontalInset + spacing.md, y + 104);
    if (locked) button.alpha = 0.45;
    content.addChild(card, eyebrowNode, titleNode, body, button);
  };

  const renderPlay = (): void => {
    addBackButton();
    const heading = pageTitle('PLAY', 'Choose a path', 'One ruleset. Different strategic contexts.');
    heading.position.set(layout.horizontalInset, 96);
    content.addChild(heading);
    modeCard(202, 'MAIN STORY', 'Six-chapter campaign', 'Learn the board, then learn the heroes.', 'ENTER', () => navigate({ screen: 'story' }));
    modeCard(382, 'FREE BATTLE', 'Build your matchup', 'Choose hero, opponent and CPU difficulty.', 'ENTER', () => navigate({ screen: 'free-battle' }));
    modeCard(562, 'ROGUELIKE', 'Run-based mastery', 'Architecture-ready. Not part of v1 launch scope.', 'LOCKED', () => undefined, true);
  };

  const renderStory = (): void => {
    addBackButton();
    const snapshot = flow.snapshot();
    const heading = pageTitle('MAIN STORY', 'Chapter One', 'Learn the rules before the board learns you.');
    heading.position.set(layout.horizontalInset, 92);
    content.addChild(heading);

    EASY_STORY_ENCOUNTERS.forEach((encounter, index) => {
      const y = 196 + index * 82;
      const completed = snapshot.profile.story.completedEncounterIds.includes(encounter.id);
      const unlocked = isStoryEncounterUnlocked(snapshot.profile, encounter.id);
      const card = surface(layout.contentWidth, 68, unlocked);
      card.position.set(layout.horizontalInset, y);
      const code = label(encounter.boss ? 'BOSS' : encounter.id, type.caption, encounter.boss ? color.danger : color.gold, '700');
      code.position.set(44, y + 12);
      const concepts = label(encounter.concepts.slice(0, 2).join(' · ').toUpperCase(), 10, unlocked ? color.inkSoft : color.muted, '500');
      concepts.position.set(44, y + 34);
      const state = label(completed ? 'CLEARED' : unlocked ? 'ENTER' : 'LOCKED', type.caption, completed ? color.inkSoft : unlocked ? color.gold : color.muted, '700');
      state.anchor.set(1, 0);
      state.position.set(342, y + 23);
      content.addChild(card, code, concepts, state);

      if (unlocked) {
        const hit = new Graphics().rect(layout.horizontalInset, y, layout.contentWidth, 68).fill({ color: color.ink, alpha: 0.001 });
        hit.eventMode = 'static';
        hit.cursor = 'pointer';
        hit.on('pointertap', () => {
          const result = flow.startStory(encounter.id);
          if (result.ok) navigate({ screen: 'battle' });
        });
        content.addChild(hit);
      }
    });
  };

  const selectorRow = (titleText: string, values: readonly string[], selected: string, y: number, onSelect: (value: string) => void, enabled?: (value: string) => boolean): void => {
    const titleNode = label(titleText, type.caption, color.inkSoft, '700');
    titleNode.position.set(layout.horizontalInset, y);
    content.addChild(titleNode);
    values.forEach((value, index) => {
      const allowed = enabled ? enabled(value) : true;
      const button = actionButton(value.toUpperCase(), 104, 48, () => allowed && onSelect(value), selected === value && allowed);
      button.position.set(layout.horizontalInset + index * 112, y + 24);
      if (!allowed) button.alpha = 0.35;
      content.addChild(button);
    });
  };

  const selectorGrid = (
    titleText: string,
    values: readonly HeroId[],
    selected: HeroId,
    y: number,
    onSelect: (value: HeroId) => void,
    enabled?: (value: HeroId) => boolean,
  ): void => {
    const titleNode = label(titleText, type.caption, color.inkSoft, '700');
    titleNode.position.set(layout.horizontalInset, y);
    content.addChild(titleNode);

    values.forEach((value, index) => {
      const allowed = enabled ? enabled(value) : true;
      const row = Math.floor(index / 3);
      const column = index % 3;
      const button = actionButton(heroLabel(value), 104, 48, () => allowed && onSelect(value), selected === value && allowed);
      button.position.set(layout.horizontalInset + column * 112, y + 24 + row * 56);
      if (!allowed) button.alpha = 0.35;
      content.addChild(button);
    });
  };

  const renderFreeBattle = (): void => {
    addBackButton();
    const snapshot = flow.snapshot();
    const heading = pageTitle('FREE BATTLE', 'Match setup', 'Choose your engine, opponent and pressure level.');
    heading.position.set(layout.horizontalInset, 92);
    content.addChild(heading);

    const selectable = new Set(snapshot.freeBattleAccess.playerHeroIds);
    selectorGrid('YOUR HERO', heroIds, snapshot.freeBattle.playerHeroId, 188, (value) => {
      flow.selectPlayerHero(value);
      render();
    }, (value) => selectable.has(value));

    if (snapshot.freeBattleAccess.validationOverride) {
      const validation = label('ROSTER VALIDATION', 10, color.violet, '700');
      validation.anchor.set(1, 0);
      validation.position.set(layout.referenceWidth - layout.horizontalInset, 188);
      content.addChild(validation);
    }

    selectorGrid('CPU HERO', heroIds, snapshot.freeBattle.cpuHeroId, 326, (value) => {
      flow.selectCpuHero(value);
      render();
    });
    selectorRow('DIFFICULTY', ['easy', 'normal'], snapshot.freeBattle.cpuDifficulty, 464, (value) => {
      flow.selectDifficulty(value as 'easy' | 'normal');
      render();
    });

    const selectedHero = heroPresentation[snapshot.freeBattle.playerHeroId];
    const summary = surface(layout.contentWidth, 116, true);
    summary.position.set(layout.horizontalInset, 560);
    const versus = label(`${selectedHero.displayName}  VS  ${heroLabel(snapshot.freeBattle.cpuHeroId)}`, type.heading, color.ink, '700');
    versus.anchor.set(0.5, 0);
    versus.position.set(layout.referenceWidth / 2, 578);
    const engine = label(selectedHero.engineLabel, type.caption, color.gold, '700');
    engine.anchor.set(0.5, 0);
    engine.position.set(layout.referenceWidth / 2, 608);
    const plan = label(selectedHero.battlePlan, 10, color.inkSoft, '500');
    plan.anchor.set(0.5, 0);
    plan.position.set(layout.referenceWidth / 2, 630);
    const difficulty = label(`CPU · ${snapshot.freeBattle.cpuDifficulty.toUpperCase()}`, 10, color.muted, '700');
    difficulty.anchor.set(0.5, 0);
    difficulty.position.set(layout.referenceWidth / 2, 650);
    const start = actionButton('START BATTLE', layout.contentWidth, 60, () => {
      const result = flow.startFreeBattle();
      if (result.ok) navigate({ screen: 'battle' });
    }, true);
    start.position.set(layout.horizontalInset, 704);
    content.addChild(summary, versus, engine, plan, difficulty, start);
  };

  const renderBattle = (): void => {
    addBackButton();
    const session = flow.snapshot().session;
    if (!session) {
      const missing = label('NO ACTIVE SESSION', type.heading, color.danger, '700');
      missing.position.set(48, 120);
      content.addChild(missing);
      return;
    }

    const settlement = flow.settleActiveSession();
    const canNext = session.state.match.status === 'victory'
      && session.config.mode.kind === 'story'
      && settlement.nextStoryEncounterId !== null;

    renderBattleScreen(content, session, () => render({ screen: 'battle' }), {
      canNext,
      onRematch: () => {
        const result = flow.rematch();
        if (result.ok) render({ screen: 'battle' });
      },
      onNext: () => {
        const result = flow.startNextStoryEncounter();
        if (result.ok) render({ screen: 'battle' });
      },
      onReturn: leaveBattle,
    });
  };

  const renderPlaceholder = (eyebrow: string, titleText: string, subtitle: string): void => {
    addBackButton();
    const heading = pageTitle(eyebrow, titleText, subtitle);
    heading.position.set(layout.horizontalInset, 112);
    const panel = surface(layout.contentWidth, 240, true);
    panel.position.set(layout.horizontalInset, 256);
    const status = label('PRESENTATION SLICE', type.caption, color.gold, '700');
    status.style.letterSpacing = 2;
    status.position.set(48, 286);
    const body = label('This product surface is intentionally deferred\nto keep the current slice focused.', type.body, color.inkSoft, '400');
    body.position.set(48, 326);
    body.style.lineHeight = 24;
    content.addChild(heading, panel, status, body);
  };

  const render = (route: AppRoute = router.current()): void => {
    content.removeChildren();
    content.addChild(new Graphics().rect(0, 0, layout.referenceWidth, layout.referenceHeight).fill(color.canvas));
    switch (route.screen) {
      case 'home': renderHome(); break;
      case 'play': renderPlay(); break;
      case 'story': renderStory(); break;
      case 'free-battle': renderFreeBattle(); break;
      case 'heroes': renderPlaceholder('HEROES', 'Hero archive', 'Engines, abilities and unlock progression.'); break;
      case 'battle': renderBattle(); break;
    }
  };

  const resize = (width: number, height: number): void => {
    const scale = Math.min(width / layout.referenceWidth, height / layout.referenceHeight);
    viewport.scale.set(scale);
    viewport.position.set(Math.floor((width - layout.referenceWidth * scale) / 2), Math.floor((height - layout.referenceHeight * scale) / 2));
  };

  render();
  return { root: viewport, render, resize };
}
