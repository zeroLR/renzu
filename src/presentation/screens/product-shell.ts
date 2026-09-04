import { Container, Graphics } from 'pixi.js';
import type { ProductFlow } from '../../app/game-session/product-flow';
import type { AppRoute, AppRouter } from '../../app/routing/router';
import { actionButton, label, pageTitle, surface } from '../../design-system/components/primitives';
import { color, layout, spacing, type } from '../../design-system/tokens/tokens';
import { heroIds, type HeroId } from '../../heroes/domain/hero-definition';
import { EASY_STORY_ENCOUNTERS, isStoryEncounterUnlocked } from '../../modes/story/story-content';

export interface ProductShell {
  root: Container;
  render(route?: AppRoute): void;
  resize(width: number, height: number): void;
}

const heroLabel = (heroId: HeroId): string => heroId.toUpperCase();

export function createProductShell(router: AppRouter, flow: ProductFlow): ProductShell {
  const viewport = new Container();
  const content = new Container();
  viewport.addChild(content);

  const navigate = (route: AppRoute): void => {
    router.navigate(route);
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
    content.addChild(mark);

    const titleNode = label('RENZU', type.display, color.ink, '700');
    titleNode.anchor.set(0.5);
    titleNode.style.letterSpacing = 8;
    titleNode.position.set(layout.referenceWidth / 2, 304);
    content.addChild(titleNode);

    const subtitle = label('HERO TACTICS · FIVE IN A ROW', type.caption, color.inkSoft, '600');
    subtitle.anchor.set(0.5);
    subtitle.style.letterSpacing = 2;
    subtitle.position.set(layout.referenceWidth / 2, 350);
    content.addChild(subtitle);

    const play = actionButton('PLAY', layout.contentWidth, 64, () => navigate({ screen: 'play' }), true);
    play.position.set(layout.horizontalInset, 498);
    const heroes = actionButton('HEROES', layout.contentWidth, 56, () => navigate({ screen: 'heroes' }));
    heroes.position.set(layout.horizontalInset, 578);
    content.addChild(play, heroes);

    const note = label('Board decisions remain the authority.', type.caption, color.muted, '500');
    note.anchor.set(0.5);
    note.position.set(layout.referenceWidth / 2, 742);
    content.addChild(note);
  };

  const modeCard = (y: number, eyebrow: string, titleText: string, description: string, action: string, onPress: () => void, locked = false): void => {
    const card = surface(layout.contentWidth, 164, true);
    card.position.set(layout.horizontalInset, y);
    content.addChild(card);
    const eyebrowNode = label(eyebrow, type.caption, locked ? color.muted : color.gold, '700');
    eyebrowNode.position.set(layout.horizontalInset + spacing.md, y + 18);
    const titleNode = label(titleText, type.heading, locked ? color.muted : color.ink, '700');
    titleNode.position.set(layout.horizontalInset + spacing.md, y + 43);
    const body = label(description, type.caption, color.inkSoft, '400');
    body.position.set(layout.horizontalInset + spacing.md, y + 73);
    const button = actionButton(action, 132, 44, onPress, !locked);
    button.position.set(layout.horizontalInset + spacing.md, y + 104);
    if (locked) button.alpha = 0.45;
    content.addChild(eyebrowNode, titleNode, body, button);
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
      content.addChild(card);

      const code = label(encounter.boss ? 'BOSS' : encounter.id, type.caption, encounter.boss ? color.danger : color.gold, '700');
      code.position.set(44, y + 12);
      const concepts = label(encounter.concepts.slice(0, 2).join(' · ').toUpperCase(), 10, unlocked ? color.inkSoft : color.muted, '500');
      concepts.position.set(44, y + 34);
      const state = label(completed ? 'CLEARED' : unlocked ? 'ENTER' : 'LOCKED', type.caption, completed ? color.inkSoft : unlocked ? color.gold : color.muted, '700');
      state.anchor.set(1, 0);
      state.position.set(342, y + 23);
      content.addChild(code, concepts, state);

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
      const button = actionButton(value.toUpperCase(), 104, 44, () => allowed && onSelect(value), selected === value && allowed);
      button.position.set(layout.horizontalInset + index * 112, y + 24);
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

    const owned = (value: string): boolean => snapshot.profile.unlockedHeroes.includes(value as HeroId);
    selectorRow('YOUR HERO', heroIds.slice(0, 3), snapshot.freeBattle.playerHeroId, 206, (value) => { flow.selectPlayerHero(value as HeroId); render(); }, owned);
    selectorRow('CPU HERO', heroIds.slice(0, 3), snapshot.freeBattle.cpuHeroId, 304, (value) => { flow.selectCpuHero(value as HeroId); render(); });
    selectorRow('DIFFICULTY', ['easy', 'normal'], snapshot.freeBattle.cpuDifficulty, 402, (value) => { flow.selectDifficulty(value as 'easy' | 'normal'); render(); });

    const summary = surface(layout.contentWidth, 132, true);
    summary.position.set(layout.horizontalInset, 518);
    content.addChild(summary);
    const versus = label(`${heroLabel(snapshot.freeBattle.playerHeroId)}  VS  ${heroLabel(snapshot.freeBattle.cpuHeroId)}`, type.heading, color.ink, '700');
    versus.anchor.set(0.5, 0);
    versus.position.set(layout.referenceWidth / 2, 544);
    const difficulty = label(`CPU · ${snapshot.freeBattle.cpuDifficulty.toUpperCase()}`, type.caption, color.gold, '700');
    difficulty.anchor.set(0.5, 0);
    difficulty.position.set(layout.referenceWidth / 2, 580);
    content.addChild(versus, difficulty);

    const start = actionButton('START BATTLE', layout.contentWidth, 60, () => {
      const result = flow.startFreeBattle();
      if (result.ok) navigate({ screen: 'battle' });
    }, true);
    start.position.set(layout.horizontalInset, 678);
    content.addChild(start);
  };

  const renderBattle = (): void => {
    addBackButton();
    const session = flow.snapshot().session;
    const heading = pageTitle('BATTLE', session?.config.mode.kind === 'story' ? 'Story encounter' : 'Free battle', 'Session created through the shared gameplay runtime.');
    heading.position.set(layout.horizontalInset, 92);
    content.addChild(heading);

    const panel = surface(layout.contentWidth, 330, true);
    panel.position.set(layout.horizontalInset, 220);
    content.addChild(panel);
    if (!session) {
      const missing = label('NO ACTIVE SESSION', type.heading, color.danger, '700');
      missing.position.set(48, 260);
      content.addChild(missing);
      return;
    }

    const mode = session.config.mode.kind === 'story' ? `STORY · ${session.config.mode.encounterId}` : 'FREE BATTLE';
    const rows = [
      mode,
      `YOU · ${heroLabel(session.config.playerHeroId)}`,
      `CPU · ${heroLabel(session.config.cpuHeroId)}`,
      `DIFFICULTY · ${session.config.cpuDifficulty.toUpperCase()}`,
      `TURN · ${session.state.match.turn}`,
    ];
    rows.forEach((row, index) => {
      const node = label(row, index === 0 ? type.caption : type.body, index === 0 ? color.gold : color.ink, index === 0 ? '700' : '500');
      node.position.set(48, 258 + index * 46);
      content.addChild(node);
    });
    const note = label('Battle board + HUD rebuild is the next slice.', type.caption, color.muted, '500');
    note.position.set(48, 490);
    content.addChild(note);
  };

  const renderPlaceholder = (eyebrow: string, titleText: string, subtitle: string): void => {
    addBackButton();
    const heading = pageTitle(eyebrow, titleText, subtitle);
    heading.position.set(layout.horizontalInset, 112);
    content.addChild(heading);
    const panel = surface(layout.contentWidth, 240, true);
    panel.position.set(layout.horizontalInset, 256);
    content.addChild(panel);
    const status = label('PRESENTATION SLICE', type.caption, color.gold, '700');
    status.style.letterSpacing = 2;
    status.position.set(48, 286);
    const body = label('This product surface is intentionally deferred\nto keep the current slice focused.', type.body, color.inkSoft, '400');
    body.position.set(48, 326);
    body.style.lineHeight = 24;
    content.addChild(status, body);
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
