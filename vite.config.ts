import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production'
    ? '/renzu/'
    : mode === 'staging'
      ? '/renzu/staging/'
      : '/',
}));
