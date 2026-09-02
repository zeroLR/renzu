import { defineConfig } from 'vite';

const deployTarget = process.env.RENZU_DEPLOY_TARGET;

const base = deployTarget === 'production'
  ? '/renzu/'
  : deployTarget === 'staging'
    ? '/renzu/staging/'
    : '/';

export default defineConfig({
  base,
});
