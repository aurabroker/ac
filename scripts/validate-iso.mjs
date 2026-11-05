#!/usr/bin/env node
// Rysunki izometryczne (src/lib/iso, plan grafik — docs/plan-grafik.md) na danych z builda:
//  - każda strona HTML ma miniaturę /fig/<ścieżka>.svg z motywem (data-motif="motyw:wariant") z listy 16 motywów,
//    a rysunek w nagłówku (jeśli jest) ma ten sam motyw i wariant co miniatura,
//  - nigdzie nie ma procesora: motywów stack/qfp/pcb/bga ani ról i klas układu scalonego
//    (i-ball, i-pin, i-pad, i-via, i-die-line, i-trace bez -hi, iso-k…),
//  - w żadnym rzędzie kart (te same miniatury jako sąsiednie elementy jednej siatki) nie stoją obok siebie
//    dwie karty z tym samym motywem i wariantem (błąd); ten sam motyw i wariant 2–3 karty dalej = ostrzeżenie
//    (w siatce 2- albo 3-kolumnowej stałyby jedna nad drugą),
//  - podpisy (nagłówek: tekst <text>, miniatura: kontury znaków odczytane z powrotem na litery) mają ≤ 28 znaków
//    i nie zawierają liczb (scene.ts HAS_NUMBER — ta sama reguła co schemat treści i spec.ts); miniatura ≤ 3 podpisy,
//    nagłówek ≤ 4, najwyżej jeden czerwony i zawsze w prawej kolumnie,
//  - strony prawne (data-kind="legal") mają spokojną miniaturę: bez podpisów, błękitu i czerwieni,
//  - miniatura ≤ 4 KB gz (ostrzeżenie), > 4,5 KB gz = błąd; para rysunków nagłówka (szeroki + wąski) > 5 KB gz
//    = ostrzeżenie (ciężki rysunek w HTML strony),
//  - <title> i <desc> rysunku w nagłówku są niepuste i nigdy nie mówią o „układzie scalonym” ani procesorze.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { fromHtml } from 'hast-util-from-html';
import { outDir, walk, pagePathOf, read, report } from './lib/dist.mjs';

const root = outDir();
const verbose = process.argv.includes('--verbose');
const errors = [];
const warnings = [];

const WARN_GZ = 4096;
const MAX_GZ = 4608;
const WARN_HEAD_GZ = 5120;
const CHIP_MOTIFS = new Set(['stack', 'qfp', 'pcb', 'bga']);
const CHIP_CLASS = /\b(?:i-(?:ball|pin|pad|via|die-line)(?:-hi|-sig)?|i-trace(?![\w-])|iso-k\d+)\b/;
const CHIP_WORDS = /układ\w*\s+scalon\w*|procesor\w*/i;
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
// kolory błękitu i czerwieni z render.ts (miniatury spokojne nie mogą ich mieć)
const ACCENTS = ['#1f4bc2', '#eef3fc', '#dde6f8', '#cc3d0a', '#fdf1ec', '#f8e1d7'];
const SIG = '#cc3d0a';

/**
 * Kontrakt sceny (src/lib/iso/scene.ts): lista motywów, limit długości podpisu i reguła „bez liczb”.
 * Import .ts wymaga Node z obsługą typów TS (22.18+, w CI 24); starszy Node — odczyt z tekstu źródła.
 */
let MOTIF_IDS = null;
let LABEL_MAX = 28;
let HAS_NUMBER = null;
try {
  ({ MOTIF_IDS, LABEL_MAX, HAS_NUMBER } = await import('../src/lib/iso/scene.ts'));
} catch {
  const src = readFileSync(join(REPO, 'src/lib/iso/scene.ts'), 'utf8');
  const block = /MOTIF_IDS\s*=\s*\[([\s\S]*?)\]/.exec(src)?.[1] ?? '';
  MOTIF_IDS = [...block.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
  LABEL_MAX = Number(/LABEL_MAX\s*=\s*(\d+)/.exec(src)?.[1] ?? 28);
  const re = /HAS_NUMBER\s*=\s*\/(.+)\/([a-z]*);/.exec(src);
  if (re) HAS_NUMBER = new RegExp(re[1], re[2]);
}
if (!MOTIF_IDS?.length || !HAS_NUMBER) {
  console.error('✗ Rysunki izometryczne: nie da się odczytać kontraktu sceny (src/lib/iso/scene.ts)');
  process.exit(1);
}
const MOTIFS = new Set(MOTIF_IDS);

/**
 * Odwrotna mapa konturów znaków (glyphs.ts) → litera, do odczytu podpisów miniatur. Mapa trafia do użytku tylko
 * w całości (błąd w połowie = brak mapy, nie pusta mapa). Bez mapy podpisy miniatur nie są sprawdzane:
 * lokalnie to ostrzeżenie, w CI (zmienna CI) — błąd.
 */
let glyphMap = null;
try {
  const { glyph } = await import('../src/lib/iso/glyphs.ts');
  const chars = 'AĄBCĆDEĘFGHIJKLŁMNŃOÓPQRSŚTUVWXYZŹŻ0123456789&–-—:/.,\'’„”()+?!%';
  const map = new Map();
  for (const ch of chars) {
    const d = await glyph(ch);
    if (d && !map.has(d)) map.set(d, ch);
  }
  if (map.size < 30) throw new Error(`za mało konturów (${map.size})`);
  glyphMap = map;
} catch (e) {
  glyphMap = null;
  const msg = `podpisy miniatur nie zostały odczytane (kontury znaków niedostępne: ${String(e?.message ?? e).split('\n')[0]})`;
  if (process.env.CI) errors.push(msg);
  else warnings.push(msg);
}

const keyOf = (pagePath) => {
  const k = pagePath.replace(/^\/|\/$/g, '');
  return k === '' ? 'index' : k;
};
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function checkLabel(where, text) {
  const n = [...text].length;
  if (n > LABEL_MAX) errors.push(`${where}: podpis „${text}” ma ${n} znaków (limit ${LABEL_MAX})`);
  if (HAS_NUMBER.test(text)) errors.push(`${where}: podpis „${text}” zawiera liczbę`);
}

/** Podpisy miniatury: wiersze <g fill transform="translate(…) scale(…)"> po odnośniku (path + circle). */
function thumbLabels(svg) {
  const defs = new Map();
  for (const m of svg.matchAll(/<path id="([^"]+)" d="([^"]+)"\/>/g)) defs.set(m[1], m[2]);
  const labels = [];
  const re = /<circle [^>]*fill="(#[0-9a-f]{6})"\/>|<g fill="(#[0-9a-f]{6})" transform="translate\(([^)]*)\)[^"]*">((?:<use [^>]*\/>)*)<\/g>/g;
  let cur = null;
  let last = -1;
  for (const m of svg.matchAll(re)) {
    if (m[1]) {
      cur = { tone: m[1], lines: [], x: 0 };
      labels.push(cur);
      last = m.index + m[0].length;
      continue;
    }
    if (!cur || m.index !== last) {
      cur = null;
      continue;
    }
    last = m.index + m[0].length;
    if (!cur.lines.length) cur.x = Number(m[3].split(/[ ,]+/)[0]);
    const uses = [...m[4].matchAll(/<use href="#([^"]+)"(?: x="([^"]+)")?\/>/g)].map((u) => ({ id: u[1], x: Number(u[2] ?? 0) }));
    let adv = Infinity;
    for (let i = 1; i < uses.length; i++) adv = Math.min(adv, uses[i].x - uses[i - 1].x);
    let line = '';
    for (const u of uses) {
      const ch = glyphMap.get(defs.get(u.id)) ?? '�';
      const pos = Number.isFinite(adv) && adv > 0 ? Math.round(u.x / adv) : line.length;
      line = line.padEnd(pos, ' ') + ch;
    }
    cur.lines.push(line);
  }
  return labels.filter((l) => l.lines.length).map((l) => ({ text: l.lines.join(' '), tone: l.tone, x: l.x }));
}

/** Rysunki w nagłówku: każdy <svg class="iso-svg …">…</svg> w HTML. */
function headerSvgs(html) {
  return [...html.matchAll(/<svg class="(iso-svg[^"]*)"[^>]*?(?: data-motif="([^"]*)")?>([\s\S]*?)<\/svg>/g)].map((m) => ({
    cls: m[1],
    motif: m[2],
    body: m[3],
    raw: m[0],
  }));
}

/* ---------- siatki kart ---------- */

const figOf = (node) =>
  node.type === 'element' && node.tagName === 'img' && typeof node.properties?.src === 'string' && node.properties.src.startsWith('/fig/')
    ? node.properties.src
    : null;

/** Zbiera miniatury w poddrzewie i wywołuje onGrid(listaMiniatur) dla każdego elementu z ≥ 2 dziećmi-kartami. */
function scanGrids(node, onGrid) {
  if (node.type !== 'element' && node.type !== 'root') return [];
  const own = figOf(node);
  if (own) return [own];
  const all = [];
  const seq = [];
  let cards = 0;
  for (const child of node.children ?? []) {
    const figs = scanGrids(child, onGrid);
    all.push(...figs);
    if (figs.length === 1) {
      seq.push(figs[0]);
      cards++;
    } else if (figs.length > 1) seq.push(null); // zagnieżdżona siatka przerywa rząd
  }
  if (cards >= 2) onGrid(seq);
  return all;
}

const thumbCache = new Map();
function thumb(src) {
  if (!thumbCache.has(src)) {
    const file = join(root, decodeURI(src));
    thumbCache.set(src, existsSync(file) ? read(file) : null);
  }
  return thumbCache.get(src);
}
const motifOf = (svg) => /^<svg [^>]*data-motif="([^"]+)"/.exec(svg ?? '')?.[1];

/* ---------- strony ---------- */

let pages = 0;
let grids = 0;
let headers = 0;
const seenThumbs = new Set();

for (const file of walk(root, new Set(['_astro', 'og']))) {
  if (!file.endsWith('.html')) continue;
  const pagePath = pagePathOf(root, file);
  if (!pagePath) continue;
  pages++;
  const html = read(file);
  const legal = /<body[^>]*data-kind="legal"/.test(html);

  // miniatura strony
  const src = `/fig/${keyOf(pagePath)}.svg`;
  const svg = thumb(src);
  let thumbMotif;
  if (svg == null) errors.push(`${pagePath}: brak miniatury ${src}`);
  else {
    seenThumbs.add(src);
    thumbMotif = motifOf(svg);
    const [motif, variant] = (thumbMotif ?? '').split(':');
    if (!thumbMotif) errors.push(`${src}: brak data-motif (motyw:wariant)`);
    else if (CHIP_MOTIFS.has(motif)) errors.push(`${src}: motyw procesora „${motif}”`);
    else if (!MOTIFS.has(motif) || !variant) errors.push(`${src}: nieznany motyw „${thumbMotif}”`);

    const gz = gzipSync(svg).length;
    if (gz > MAX_GZ) errors.push(`${src}: ${gz} B gz (limit ${MAX_GZ})`);
    else if (gz > WARN_GZ) warnings.push(`${src}: ${gz} B gz (> ${WARN_GZ})`);

    const accents = ACCENTS.filter((c) => svg.includes(c));
    if (glyphMap) {
      const labels = thumbLabels(svg);
      if (verbose) console.log(`${src} ${thumbMotif} ${gz} B gz: ${labels.map((l) => (l.tone === SIG ? `[${l.text}]` : l.text)).join(' · ') || '—'}`);
      if (labels.length > 3) errors.push(`${src}: ${labels.length} podpisów (miniatura: najwyżej 3)`);
      const red = labels.filter((l) => l.tone === SIG);
      if (red.length > 1) errors.push(`${src}: ${red.length} czerwone podpisy (najwyżej 1)`);
      for (const l of labels) {
        if (l.text.includes('�')) errors.push(`${src}: podpis „${l.text}” — nieznany znak (kontur spoza listy)`);
        checkLabel(src, l.text);
      }
      if (red.length && red[0].x < 360 * 0.4) errors.push(`${src}: czerwony podpis „${red[0].text}” nie jest w prawej kolumnie`);
      if (legal && labels.length) errors.push(`${src}: strona prawna — miniatura spokojna nie może mieć podpisów`);
    }
    if (legal && accents.length) errors.push(`${src}: strona prawna — miniatura spokojna bez błękitu i czerwieni (${accents.join(', ')})`);
  }

  // rysunek w nagłówku
  const heads = headerSvgs(html);
  if (heads.length) {
    const gz = gzipSync(heads.map((h) => h.raw).join('')).length;
    if (verbose) console.log(`  ${pagePath} nagłówek: ${gz} B gz (para kadrów)`);
    if (gz > WARN_HEAD_GZ) warnings.push(`${pagePath}: rysunki nagłówka ${gz} B gz (> ${WARN_HEAD_GZ}) — odchudź motyw`);
  }
  for (const h of heads) {
    headers++;
    const kind = /iso-svg--n/.test(h.cls) ? 'n' : 'w';
    const where = `${pagePath} (nagłówek ${kind === 'w' ? 'szeroki' : 'wąski'})`;
    const motif = (h.motif ?? '').split(':')[0];
    if (!h.motif) errors.push(`${where}: brak data-motif`);
    else if (CHIP_MOTIFS.has(motif)) errors.push(`${where}: motyw procesora „${motif}”`);
    else if (!MOTIFS.has(motif)) errors.push(`${where}: nieznany motyw „${h.motif}”`);
    else if (thumbMotif && h.motif !== thumbMotif) errors.push(`${where}: motyw ${h.motif} ≠ miniatura ${thumbMotif}`);
    const chip = CHIP_CLASS.exec(h.body);
    if (chip) errors.push(`${where}: klasa układu scalonego „${chip[0]}”`);
    const title = decode(/<title[^>]*>([^<]*)<\/title>/.exec(h.body)?.[1] ?? '');
    const desc = decode(/<desc[^>]*>([^<]*)<\/desc>/.exec(h.body)?.[1] ?? '');
    if (!title.trim() || !desc.trim()) errors.push(`${where}: pusty <title> albo <desc>`);
    if (CHIP_WORDS.test(title) || CHIP_WORDS.test(desc)) errors.push(`${where}: <title>/<desc> mówi o układzie scalonym lub procesorze`);
    const labels = [...h.body.matchAll(/<path class="i-ld([^"]*)"[^>]*\/><circle [^>]*\/>((?:<text [^>]*>[^<]*<\/text>)+)/g)].map((m) => ({
      sig: /i-sig/.test(m[1]),
      left: /text-anchor="end"/.test(m[2]),
      text: [...m[2].matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((t) => decode(t[1])).join(' '),
    }));
    if (labels.length > 4) errors.push(`${where}: ${labels.length} podpisów (nagłówek: najwyżej 4)`);
    const red = labels.filter((l) => l.sig);
    if (red.length > 1) errors.push(`${where}: ${red.length} czerwone podpisy (najwyżej 1)`);
    if (red.some((l) => l.left)) errors.push(`${where}: czerwony podpis w lewej kolumnie`);
    for (const l of labels) checkLabel(where, l.text);
    if (verbose) console.log(`  ${where} ${h.motif}: ${labels.map((l) => (l.sig ? `[${l.text}]` : l.left ? `${l.text} →` : l.text)).join(' · ')}`);
  }
  // siatki kart: sąsiednie miniatury tej samej siatki nie mogą mieć tego samego motywu i wariantu
  const tree = fromHtml(html);
  scanGrids(tree, (seq) => {
    grids++;
    if (verbose) console.log(`  ${pagePath} siatka: ${seq.map((s) => (s ? motifOf(thumb(s)) : '|')).join('  ')}`);
    for (const s of seq) if (s && thumb(s) == null) errors.push(`${pagePath}: karta z miniaturą ${s}, której nie ma w buildzie`);
    // odstęp 1 = obok siebie (błąd); 2–3 = jedna nad drugą w siatce 2- albo 3-kolumnowej (ostrzeżenie);
    // zagnieżdżona siatka (null) przerywa rząd
    for (let i = 0; i < seq.length; i++)
      for (let dist = 1; dist <= 3 && i + dist < seq.length; dist++) {
        const run = seq.slice(i, i + dist + 1);
        if (run.includes(null)) break;
        const a = seq[i];
        const b = seq[i + dist];
        const ma = motifOf(thumb(a));
        if (!ma || ma !== motifOf(thumb(b))) continue;
        if (dist === 1) errors.push(`${pagePath}: obok siebie dwie karty z tym samym rysunkiem ${ma} (${a}, ${b})`);
        else warnings.push(`${pagePath}: ten sam rysunek ${ma} ${dist} karty dalej — w węższej siatce stanie pod spodem (${a}, ${b})`);
      }
  });
}

// arkusze stylów: bez reguł ról procesora
for (const file of walk(join(root, '_astro'), new Set())) {
  if (!file.endsWith('.css')) continue;
  const css = read(file);
  for (const m of css.matchAll(/\.(i-(?:ball|pin|pad|via|die-line)(?:-hi|-sig)?|iso-k\d+)\b/g)) {
    errors.push(`${file.slice(root.length)}: reguła CSS układu scalonego .${m[1]}`);
    break;
  }
}

// miniatury bez strony (osierocone) — tylko informacja
for (const file of walk(join(root, 'fig'), new Set())) {
  const src = '/' + file.slice(root.length + 1).split('\\').join('/');
  if (file.endsWith('.svg') && !seenThumbs.has(src)) warnings.push(`${src}: miniatura bez strony w buildzie`);
}

for (const w of warnings) console.warn(`  ! ${w}`);
report('Rysunki izometryczne', errors, `${pages} stron, ${seenThumbs.size} miniatur, ${headers} rysunków w nagłówkach, ${grids} siatek kart`);
