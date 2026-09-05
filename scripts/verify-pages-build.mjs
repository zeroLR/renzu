import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2];
const expectedBase = target === 'staging' ? '/renzu/staging/' : target === 'production' ? '/renzu/' : null;
if (!expectedBase) throw new Error('usage: node scripts/verify-pages-build.mjs <staging|production>');

const indexPath = join('dist', 'index.html');
const html = readFileSync(indexPath, 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
const localRefs = refs.filter((ref) => ref.startsWith('/'));

if (localRefs.length === 0) throw new Error('no absolute build assets found in dist/index.html');
for (const ref of localRefs) {
  if (!ref.startsWith(expectedBase)) {
    throw new Error(`unexpected asset base: ${ref}; expected ${expectedBase}`);
  }
}

const assetDir = join('dist', 'assets');
if (!statSync(assetDir).isDirectory() || readdirSync(assetDir).length === 0) {
  throw new Error('dist/assets is missing or empty');
}

console.log(`Pages build verified for ${target}: ${expectedBase}`);
