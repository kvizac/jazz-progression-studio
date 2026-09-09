import { writeFile, rename, rm, cp, mkdir } from 'node:fs/promises';
// Keep the Vite source entry separate from the branch-published root index.
await rename('dist/studio.html', 'dist/index.html');
await writeFile('dist/.nojekyll', '');
await rm('site', { recursive: true, force: true });
await cp('dist', 'site', { recursive: true });
await writeFile('.nojekyll', '');
// Both publishers use the SAME URL layout: root launcher -> /site/ app.
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('site', 'dist/site', { recursive: true });
await cp('index.html', 'dist/index.html');
await writeFile('dist/.nojekyll', '');
const { verifyPages } = await import('./verify-pages.mjs');
await verifyPages();
console.log('Both GitHub Pages entry points verified.');
