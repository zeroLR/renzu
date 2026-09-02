import { Container, Graphics, Text } from 'pixi.js';
import { createRenderer } from './app/bootstrap/create-renderer';
import './style.css';

const hostElement = document.querySelector<HTMLElement>('#app');
if (!hostElement) throw new Error('[RENZU] Missing #app mount element');
const host: HTMLElement = hostElement;

function renderBootstrapFailure(error: unknown): void {
  console.error('[RENZU] Renderer bootstrap failed.', error);
  host.replaceChildren();
  const fallback = document.createElement('section');
  fallback.className = 'bootstrap-failure';
  fallback.innerHTML = '<strong>RENZU could not start.</strong><span>Please reload or try another browser.</span>';
  host.append(fallback);
}

async function bootstrap(): Promise<void> {
  try {
    const app = await createRenderer();
    const stage = new Container();
    app.stage.addChild(stage);
    host.append(app.canvas);

    const backdrop = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0x0f1115);
    const title = new Text({ text: 'RENZU', style: { fill: 0xf4efe3, fontSize: 36, fontWeight: '600', letterSpacing: 8 } });
    title.anchor.set(0.5);
    title.position.set(app.screen.width / 2, app.screen.height / 2 - 20);

    const status = new Text({ text: 'STANDALONE FOUNDATION', style: { fill: 0x99958c, fontSize: 11, letterSpacing: 3 } });
    status.anchor.set(0.5);
    status.position.set(app.screen.width / 2, app.screen.height / 2 + 32);

    stage.addChild(backdrop, title, status);

    app.renderer.on('resize', (width, height) => {
      backdrop.clear().rect(0, 0, width, height).fill(0x0f1115);
      title.position.set(width / 2, height / 2 - 20);
      status.position.set(width / 2, height / 2 + 32);
    });
  } catch (error) {
    renderBootstrapFailure(error);
  }
}

void bootstrap();
