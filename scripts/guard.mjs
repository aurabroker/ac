#!/usr/bin/env node
// Strażnik poufności (confidentiality guard).
//
// Skanuje pliki repozytorium (src, public, docs, scripts, konfiguracja) oraz katalog
// wynikowy builda (dist lub ASTRO_OUT_DIR). Każdy plik jest normalizowany (NFKC,
// bez znaków zero-width, lowercase), dzielony na tokeny [a-ząćęłńóśźż0-9-]+,
// a każdy token (oraz sklejone pary i trójki sąsiednich tokenów, warianty bez
// łączników i bez polskich znaków) jest porównywany jako
// sha256("aura-guard-v1:" + token) z listą w scripts/guard-hashes.json.
//
// Opcjonalnie: .guard/forbidden.local.txt (git-ignored) — jawne frazy do
// lokalnego użytku, dopasowywane odpornie na separatory.
//
// Strażnik NIGDY nie wypisuje dopasowanego słowa — tylko plik:linia i numer reguły.
//
// Użycie:
//   node scripts/guard.mjs                 # repo + dist (jeśli istnieje)
//   node scripts/guard.mjs path/a path/b   # tylko wskazane ścieżki
//   node scripts/guard.mjs --git-history   # dodatkowo pełna historia git (wolne)

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, resolve, extname, sep } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const cfg = JSON.parse(readFileSync(join(ROOT, 'scripts/guard-hashes.json'), 'utf8'));
const SALT = cfg.salt ?? 'aura-guard-v1:';
const HASHES = new Map(cfg.hashes.map((h, i) => [h.toLowerCase(), i + 1]));

const args = process.argv.slice(2);
const withHistory = args.includes('--git-history');
const explicitPaths = args.filter((a) => !a.startsWith('--'));

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.astro', '.guard', '.wrangler', '.cache', '.vscode', '.idea',
]);
const SKIP_DIR_PREFIXES = ['build-', 'cache-'];
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.woff', '.woff2', '.ttf', '.otf',
  '.eot', '.pdf', '.zip', '.gz', '.br', '.zst', '.mp4', '.webm', '.mp3', '.wav', '.lock',
]);
const MAX_BYTES = 8 * 1024 * 1024;

// ---------- normalizacja i tokenizacja ----------
const ZERO_WIDTH = /[­᠎​-‏‪-‮⁠-⁤﻿]/g;
const TOKEN_RE = /[a-ząćęłńóśźż0-9-]+/g;
const FOLD = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
const fold = (s) => s.replace(/[ąćęłńóśźż]/g, (c) => FOLD[c]);

const NAMED_ENTITIES = { amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', shy: '' };
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m);
}
function safeChar(cp) {
  try { return String.fromCodePoint(cp); } catch { return ' '; }
}
function normalize(s) {
  return decodeEntities(s).normalize('NFKC').replace(ZERO_WIDTH, '').toLowerCase();
}

const hashCache = new Map();
function ruleFor(token) {
  if (!token || token.length < 2) return 0;
  let r = hashCache.get(token);
  if (r === undefined) {
    const h = createHash('sha256').update(SALT + token, 'utf8').digest('hex');
    r = HASHES.get(h) ?? 0;
    hashCache.set(token, r);
  }
  return r;
}

function variants(token) {
  const out = new Set([token]);
  const trimmed = token.replace(/^-+|-+$/g, '');
  out.add(trimmed);
  if (trimmed.includes('-')) {
    out.add(trimmed.replace(/-/g, ''));
    for (const part of trimmed.split('-')) out.add(part);
  }
  for (const v of [...out]) out.add(fold(v));
  return out;
}

/** Sprawdza tekst linia po linii; zwraca listę { line, rule } */
function scanText(text, state = { prev: [] }) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = normalize(lines[i]);
    // wariant z usuniętymi znacznikami HTML/JSX (np. Na<b>zwa</b>)
    const stripped = raw.replace(/<[^>]{0,200}>/g, '');
    const found = new Set();
    for (const variant of stripped === raw ? [raw] : [raw, stripped]) {
      const tokens = variant.match(TOKEN_RE) ?? [];
      let prev = variant === raw ? state.prev : [];
      for (const t0 of tokens) {
        const t = t0.replace(/^-+|-+$/g, '');
        if (!t) continue;
        const cands = variants(t);
        if (prev.length >= 1) {
          const p1 = prev[prev.length - 1];
          cands.add(p1 + t);
          cands.add(fold(p1 + t));
          cands.add((p1 + t).replace(/-/g, ''));
          if (prev.length >= 2) {
            const p2 = prev[prev.length - 2];
            cands.add(p2 + p1 + t);
            cands.add(fold(p2 + p1 + t));
          }
        }
        for (const c of cands) {
          const r = ruleFor(c);
          if (r) found.add(r);
        }
        prev = [...prev.slice(-1), t];
      }
      if (variant === raw) state.prev = prev;
    }
    for (const rule of found) hits.push({ line: i + 1, rule });
  }
  return hits;
}

// ---------- lokalne frazy jawne ----------
const compact = (s) => fold(normalize(s)).replace(/[^a-z0-9]/g, '');
const localFile = join(ROOT, '.guard/forbidden.local.txt');
const localPhrases = existsSync(localFile)
  ? readFileSync(localFile, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map(compact)
      .filter((p) => p.length >= 3)
  : [];

function scanLocal(text) {
  if (!localPhrases.length) return [];
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const c = compact(lines[i]);
    localPhrases.forEach((p, idx) => {
      if (c.includes(p)) hits.push({ line: i + 1, local: idx + 1 });
    });
  }
  return hits;
}

// ---------- pliki ----------
function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || SKIP_DIR_PREFIXES.some((x) => e.name.startsWith(x))) continue;
      yield* walk(p);
    } else if (e.isFile()) {
      yield p;
    }
  }
}

function targets() {
  if (explicitPaths.length) return explicitPaths.map((p) => resolve(p));
  const list = [ROOT];
  const out = process.env.ASTRO_OUT_DIR ? resolve(process.env.ASTRO_OUT_DIR) : null;
  if (out && existsSync(out) && !out.startsWith(ROOT + sep)) list.push(out);
  return list;
}

const findings = [];
let scanned = 0;
const display = (p) => (p.startsWith(ROOT + sep) ? relative(ROOT, p) : p);

for (const target of targets()) {
  if (!existsSync(target)) continue;
  const files = statSync(target).isDirectory() ? walk(target) : [target];
  for (const file of files) {
    scanned++;
    // nazwa pliku też jest tekstem
    for (const h of scanText(display(file).replace(/[\\/._]/g, ' '))) {
      findings.push(`${display(file)} (ścieżka) — zakazany token #${h.rule}`);
    }
    if (BINARY_EXT.has(extname(file).toLowerCase())) continue;
    let buf;
    try {
      const st = statSync(file);
      if (st.size > MAX_BYTES) continue;
      buf = readFileSync(file);
    } catch { continue; }
    if (buf.includes(0)) continue; // binarny
    const text = buf.toString('utf8');
    for (const h of scanText(text)) findings.push(`${display(file)}:${h.line} — zakazany token #${h.rule}`);
    for (const h of scanLocal(text)) findings.push(`${display(file)}:${h.line} — zakazana fraza lokalna #${h.local}`);
  }
}

if (withHistory) {
  try {
    const log = execFileSync('git', ['log', '-p', '--all', '--format=@@commit %H'], {
      cwd: ROOT, maxBuffer: 1024 * 1024 * 1024, encoding: 'utf8',
    });
    let commit = '?';
    let fileName = '?';
    const state = { prev: [] };
    for (const line of log.split('\n')) {
      if (line.startsWith('@@commit ')) { commit = line.slice(9, 17); continue; }
      if (line.startsWith('+++ b/')) { fileName = line.slice(6); }
      for (const h of scanText(line, state)) findings.push(`historia git ${commit} ${fileName} — zakazany token #${h.rule}`);
      for (const h of scanLocal(line)) findings.push(`historia git ${commit} ${fileName} — zakazana fraza lokalna #${h.local}`);
    }
  } catch (e) {
    console.error('Strażnik poufności: nie udało się odczytać historii git:', e.message);
    process.exitCode = 2;
  }
}

if (findings.length) {
  const unique = [...new Set(findings)];
  console.error(`Strażnik poufności: ZNALEZIONO ${unique.length} naruszeń (przeskanowano ${scanned} plików).`);
  for (const f of unique.slice(0, 500)) console.error('  ✗ ' + f);
  if (unique.length > 500) console.error(`  … oraz ${unique.length - 500} kolejnych`);
  console.error('Przeredaguj tekst (bez allowlisty). Szczegóły: docs/CONVENTIONS.md § Strażnik poufności.');
  process.exit(1);
}
console.log(
  `Strażnik poufności: OK — ${scanned} plików, ${HASHES.size} reguł skrótów, ${localPhrases.length} fraz lokalnych` +
    (withHistory ? ', z historią git' : '') + '.',
);
