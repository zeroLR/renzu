import { describe, expect, it } from 'vitest';
import { createAppRouter } from '../src/app/routing/router';

describe('product shell router', () => {
  it('starts at home', () => {
    const router = createAppRouter();
    expect(router.current()).toEqual({ screen: 'home' });
  });

  it('navigates and returns through stack history', () => {
    const router = createAppRouter();
    router.navigate({ screen: 'play' });
    router.navigate({ screen: 'story' });
    expect(router.back()).toEqual({ screen: 'play' });
    expect(router.back()).toEqual({ screen: 'home' });
    expect(router.back()).toEqual({ screen: 'home' });
  });

  it('can reset to a product entry point', () => {
    const router = createAppRouter();
    router.navigate({ screen: 'heroes' });
    expect(router.reset({ screen: 'free-battle' })).toEqual({ screen: 'free-battle' });
    expect(router.current()).toEqual({ screen: 'free-battle' });
  });
});
