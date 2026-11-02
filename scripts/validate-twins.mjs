#!/usr/bin/env node
// Walidacja bliźniaków .md:
//  - każda indeksowalna strona HTML ma bliźniaka .md (i odwrotnie: każdy .md ma swoją stronę HTML),
//  - strony noindex NIE mają bliźniaka,
//  - frontmatter .md: canonical = URL strony HTML, pola title/description/updated/author/publisher,
//  - HTML linkuje bliźniaka przez <link rel="alternate" type="text/markdown">,
//  - linki w .md są absolutne (bez ścieżek względnych „/…”),
//  - zgodność treści: każdy nagłówek H2/H3 z obszaru [data-md-root] występuje w .md.
import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fromHtml } from 'hast-util-from-html';
import { select } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { outDir, walk, pagePathOf, mdPathFor, read, isNoindex, report, SITE } from './lib/dist.mjs';

const root = outDir();
const errors = [];
const htmlPages = new Map(); // pagePath -> file
const twins = new Set();

for (const file of walk(root, new Set(['_astro', 'og']))) {
  const rel = '/' + relative(root, file).split(sep).join('/');
  if (file.endsWith('.html')) {
    const p = pagePathOf(root, file);
    if (p) htmlPages.set(p, file);
  } else if (file.endsWith('.md')) {
    twins.add(rel);
  }
}

const decode = (s) =>
  s
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
// bliźniaki mają proste apostrofy i zwykłe spacje (plainText w public-md.ts) — porównujemy po normalizacji
const norm = (s) =>
  decode(s).replace(/<[^>]+>/g, '').replace(/(\p{L})\u2019(\p{L})/gu, "$1'$2").replace(/[\s\u00a0\u202f]+/g, ' ').trim();

let checked = 0;
for (const [pagePath, file] of htmlPages) {
  const html = read(file);
  const md = mdPathFor(pagePath);
  const hasTwin = twins.has(md);
  if (isNoindex(html)) {
    if (hasTwin) errors.push(`${pagePath}: strona noindex ma bliźniaka ${md}`);
    continue;
  }
  checked++;
  if (!hasTwin) {
    errors.push(`${pagePath}: brak bliźniaka ${md}`);
    continue;
  }
  const alt = new RegExp(`<link[^>]+rel="alternate"[^>]+type="text/markdown"[^>]+href="${SITE}${md.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
  if (!alt.test(html)) errors.push(`${pagePath}: brak <link rel="alternate" type="text/markdown" href="${SITE}${md}">`);

  const text = read(join(root, md));
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!fm) {
    errors.push(`${md}: brak frontmattera`);
    continue;
  }
  const field = (k) => {
    const m = new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(fm[1]);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined;
  };
  const canonical = field('canonical');
  if (canonical !== SITE + pagePath) errors.push(`${md}: canonical „${canonical}” ≠ ${SITE + pagePath}`);
  for (const k of ['title', 'description', 'updated', 'author', 'publisher']) {
    if (!field(k)) errors.push(`${md}: brak pola „${k}” we frontmatterze`);
  }
  const body = text.slice(fm[0].length);
  if (!body.includes(`Wersja kanoniczna (HTML): ${SITE + pagePath}`)) errors.push(`${md}: brak linii „Wersja kanoniczna (HTML)”`);
  const rel = /\]\((\/[^)]*)\)/.exec(body);
  if (rel) errors.push(`${md}: link względny „${rel[1]}” (wymagane absolutne)`);

  // zgodność nagłówków HTML ↔ .md: każdy H2/H3 z [data-md-root] (poza data-md-skip/aria-hidden) jest w .md
  const tree = fromHtml(html);
  const mainEl = select('[data-md-root]', tree);
  const bodyNorm = norm(body).replace(/\\/g, '');
  const visit = (node, skipped) => {
    if (node.type !== 'element' && node.type !== 'root') return;
    const props = node.properties ?? {};
    const skip = skipped || props.dataMdSkip !== undefined || props.ariaHidden === 'true' || props.hidden !== undefined;
    if (!skip && (node.tagName === 'h2' || node.tagName === 'h3')) {
      const h = norm(toString(node));
      if (h && !bodyNorm.includes(h)) errors.push(`${md}: brak nagłówka „${h}” obecnego w HTML`);
    }
    for (const c of node.children ?? []) visit(c, skip);
  };
  if (mainEl) visit(mainEl, false);
  else errors.push(`${pagePath}: brak elementu [data-md-root]`);
}

for (const md of twins) {
  const pagePath = md === '/index.md' ? '/' : md.replace(/\.md$/, '/');
  if (!htmlPages.has(pagePath)) errors.push(`${md}: brak strony HTML ${pagePath}`);
}

report('Bliźniaki .md', errors, `${checked} stron indeksowalnych, ${twins.size} plików .md`);
if (!existsSync(join(root, 'llms-full.txt'))) {
  console.error('Brak llms-full.txt');
  process.exit(1);
}
