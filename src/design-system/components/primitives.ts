import { Container, Graphics, Text, type FederatedPointerEvent } from 'pixi.js';
import { color, radius, type } from '../tokens/tokens';

type FontWeight = '400' | '500' | '600' | '700';

export function label(text: string, size: number = type.body, fill: number = color.ink, weight: FontWeight = '500'): Text {
  return new Text({
    text,
    style: {
      fill,
      fontSize: size,
      fontWeight: weight,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    },
  });
}

export function surface(width: number, height: number, elevated = false): Graphics {
  return new Graphics()
    .roundRect(0, 0, width, height, radius.md)
    .fill(elevated ? color.surfaceRaised : color.surface)
    .stroke({ color: color.edge, width: 1 });
}

export function actionButton(
  text: string,
  width: number,
  height: number,
  onPress: () => void,
  primary = false,
): Container {
  const root = new Container();
  const background = new Graphics()
    .roundRect(0, 0, width, height, radius.md)
    .fill(primary ? color.gold : color.surfaceRaised)
    .stroke({ color: primary ? color.gold : color.edge, width: 1 });
  background.eventMode = 'static';
  background.cursor = 'pointer';
  background.on('pointertap', (_event: FederatedPointerEvent) => onPress());

  const textNode = label(text, type.body, primary ? color.canvas : color.ink, '700');
  textNode.anchor.set(0.5);
  textNode.position.set(width / 2, height / 2);
  root.addChild(background, textNode);
  return root;
}

export function pageTitle(eyebrow: string, titleText: string, subtitle?: string): Container {
  const root = new Container();
  const eyebrowNode = label(eyebrow.toUpperCase(), type.caption, color.gold, '700');
  eyebrowNode.style.letterSpacing = 2;
  const titleNode = label(titleText, type.title, color.ink, '700');
  titleNode.y = 24;
  root.addChild(eyebrowNode, titleNode);
  if (subtitle) {
    const subtitleNode = label(subtitle, type.body, color.inkSoft, '400');
    subtitleNode.y = 62;
    root.addChild(subtitleNode);
  }
  return root;
}
