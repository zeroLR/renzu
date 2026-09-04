import { Container, Graphics } from 'pixi.js';
import type { AppRoute, AppRouter } from '../../app/routing/router';
import { actionButton, label, pageTitle, surface } from '../../design-system/components/primitives';
import { color, layout, spacing, type } from '../../design-system/tokens/tokens';

export interface ProductShell {
  root: Container;
  render(route?: AppRoute): void;
  resize(width: number, height: number): void;
}

export function createProductShell(router: AppRouter): ProductShell {
  const viewport = new Container();
  const content = new Container();
  viewport.addChild(content);

  const navigate = (route: AppRoute): void => {
    router.navigate(route);
    render();
  };

  const addBackButton = (): void => {
    const back = actionButton('‹', 48, 48, () => {
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

  const modeCard = (
    y: number,
    eyebrow: string,
    titleText: string,
    description: string,
    action: string,
    onPress: () => void,
    locked = false,
  ): void => {
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
    const body = label('Gameplay configuration is already wired.\nThe next presentation slice will replace\nthis panel with the real interaction flow.', type.body, color.inkSoft, '400');
    body.position.set(48, 326);
    body.style.lineHeight = 24;
    content.addChild(status, body);
  };

  const render = (route: AppRoute = router.current()): void => {
    content.removeChildren();
    content.addChild(new Graphics().rect(0, 0, layout.referenceWidth, layout.referenceHeight).fill(color.canvas));

    switch (route.screen) {
      case 'home':
        renderHome();
        break;
      case 'play':
        renderPlay();
        break;
      case 'story':
        renderPlaceholder('MAIN STORY', 'Chapter One', 'Sequential encounters, durable progression.');
        break;
      case 'free-battle':
        renderPlaceholder('FREE BATTLE', 'Match setup', 'Hero, opponent and difficulty configuration.');
        break;
      case 'heroes':
        renderPlaceholder('HEROES', 'Hero archive', 'Engines, abilities and unlock progression.');
        break;
    }
  };

  const resize = (width: number, height: number): void => {
    const scale = Math.min(width / layout.referenceWidth, height / layout.referenceHeight);
    viewport.scale.set(scale);
    viewport.position.set(
      Math.floor((width - layout.referenceWidth * scale) / 2),
      Math.floor((height - layout.referenceHeight * scale) / 2),
    );
  };

  render();
  return { root: viewport, render, resize };
}
