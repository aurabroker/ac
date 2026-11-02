// Wspólne narzędzia skryptów walidacyjnych: katalog wynikowy builda i lista plików.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

export const SITE = 'https://www.auraconsulting.pl';

export function outDir() {
  const dir = resolve(process.env.ASTRO_OUT_DIR || 'dist');
  if (!existsSync(dir)) {
    console.error(`Brak katalogu builda: ${dir}. Uruchom najpierw „npm run build” (z tym samym ASTRO_OUT_DIR).`);
    process.exit(2);
  }
  return dir;
}

export function* walk(dir, skip = new Set(['_astro'])) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (skip.has(e.name)) continue;
      yield* walk(p, skip);
    } else if (e.isFile()) yield p;
  }
}

/** Ścieżka URL dla pliku HTML: index.html → /, a/index.html → /a/, 404.html → null. */
export function pagePathOf(root, file) {
  const rel = relative(root, file).split(sep).join('/');
  if (!rel.endsWith('.html')) return null;
  if (rel === '404.html' || rel === '500.html') return null;
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.replace(/\.html$/, '/');
}

export function mdPathFor(pagePath) {
  return pagePath === '/' ? '/index.md' : pagePath.replace(/\/$/, '') + '.md';
}

export function read(file) {
  return readFileSync(file, 'utf8');
}

export function isNoindex(html) {
  const m = /<meta\s+name="robots"\s+content="([^"]*)"/i.exec(html);
  return !!m && /noindex/i.test(m[1]);
}

export function report(name, errors, okMsg) {
  if (errors.length) {
    console.error(`${name}: ${errors.length} błędów`);
    for (const e of errors.slice(0, 200)) console.error('  ✗ ' + e);
    if (errors.length > 200) console.error(`  … oraz ${errors.length - 200} kolejnych`);
    process.exit(1);
  }
  console.log(`${name}: OK — ${okMsg}`);
}
