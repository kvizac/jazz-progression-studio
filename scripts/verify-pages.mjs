import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
export async function verifyPages() {
  const root = await readFile('index.html', 'utf8');
  assert(root.includes('url=./site/'), 'The branch entry must open the compiled site.');
  assert(!root.includes('/src/'), 'Raw application source must never be published as the entry.');
  assert.equal(await readFile('dist/index.html', 'utf8'), root, 'Both publishers must share the root launcher.');
  const built = await readFile('dist/site/index.html', 'utf8');
  const branch = await readFile('site/index.html', 'utf8');
  assert.equal(branch, built, 'Actions and branch publishers must serve the same built app.');
  assert(!built.includes('/src/') && !built.includes('.tsx'), 'The built entry must not reference TypeScript.');
  const assets = [...built.matchAll(/(?:src|href)="(\.\/assets\/[^"?#]+)"/g)].map(m => m[1]);
  assert(assets.some(p => p.endsWith('.js')), 'Missing compiled JavaScript.');
  for (const folder of ['dist/site', 'site']) {
    for (const asset of assets) assert((await stat(join(folder, asset))).size > 0, `Missing ${folder}/${asset}`);
    assert((await stat(join(folder, 'piano/C3.mp3'))).size > 1000, 'Missing piano samples.');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyPages();
  console.log('GitHub Pages source and compiled asset checks passed.');
}
