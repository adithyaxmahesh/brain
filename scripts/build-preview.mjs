/**
 * Builds the app into one self-contained HTML fragment with the CSS and JS
 * inlined, for hosting somewhere that serves a single file and blocks external
 * requests. Emits page content only — no <html>/<head>/<body> wrapper.
 *
 *   node scripts/build-preview.mjs [outfile]
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = join(import.meta.dirname, '..');
const out = process.argv[2] ?? join(root, 'dist-preview', 'company-brain.html');

console.log('building…');
execSync('npx vite build --outDir dist-preview-assets', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_ROUTER: 'hash' },
});

const assetDir = join(root, 'dist-preview-assets', 'assets');
const files = readdirSync(assetDir);
const js = files.find((f) => f.endsWith('.js'));
const css = files.find((f) => f.endsWith('.css'));
if (!js || !css) throw new Error(`expected one .js and one .css in ${assetDir}`);

const script = readFileSync(join(assetDir, js), 'utf8');
const styles = readFileSync(join(assetDir, css), 'utf8');

// `</script>` inside a string literal would close the tag early.
const safeScript = script.replaceAll('</script', '<\\/script');

const html = `<title>Company Brain</title>
<style>
${styles}
/* The host page paints its own ground behind this one. */
html,
body {
  height: 100%;
  background: rgb(var(--cb-canvas));
}
</style>
<div id="root"></div>
<script type="module">
${safeScript}
</script>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out} — ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
