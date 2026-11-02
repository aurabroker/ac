#!/usr/bin/env node
// Sprawdzanie linków wewnętrznych w dist/ (offline, bez sieci):
//  - href/src w HTML (a, link, script, img, source) oraz linki w .md, llms.txt, sitemapach i RSS
//    wskazujące na https://www.auraconsulting.pl/… lub ścieżki /…,
//  - cel musi istnieć jako plik (/x/ → x/index.html, /x.md → x.md, /og/x.png → og/x.png),
//    albo być przekierowaniem z _redirects (cel każdego przekierowania też musi istnieć),
//  - kotwice #id muszą istnieć w docelowym HTML,
//  - ścieżki stron bez ukośnika na końcu są błędem (trailingSlash: always).
import { existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { outDir, walk, read, report, SITE } from './lib/dist.mjs';

const root = outDir();
const errors = [];
const idCache = new Map();
const redirects = new Set();
const redirectPrefixes = [];
const redirectTargets = [];

if (existsSync(join(root, '_redirects'))) {
  for (const line of read(join(root, '_redirects')).split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from, to] = t.split(/\s+/);
    if (from.endsWith('*')) redirectPrefixes.push(from.slice(0, -1));
    else redirects.add(from);
    if (to) redirectTargets.push(to);
  }
}

function idsOf(file) {
  if (!idCache.has(file)) {
    const html = read(file);
    const ids = new Set();
    for (const m of html.matchAll(/\s(?:id|name)="([^"]+)"/g)) ids.add(m[1]);
    idCache.set(file, ids);
  }
  return idCache.get(file);
}

function resolveTarget(pathname) {
  let p = decodeURIComponent(pathname);
  if (p.endsWith('/')) {
    const f = join(root, p, 'index.html');
    return existsSync(f) ? f : null;
  }
  const f = join(root, p);
  if (existsSync(f) && statSync(f).isFile()) return f;
  return null;
}

function check(from, raw) {
  if (!raw) return;
  let href = raw.replace(/&amp;/g, '&').trim();
  if (/^(mailto:|tel:|data:|javascript:)/i.test(href)) return;
  if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
  else if (/^https?:\/\//i.test(href) || href.startsWith('//')) return; // zewnętrzne — poza zakresem (offline)
  const [pathAndQuery, hash] = href.split('#');
  const pathname = pathAndQuery.split('?')[0];
  let target;
  if (pathname === '') {
    target = from.endsWith('.html') ? from : null;
  } else {
    const abs = pathname.startsWith('/') ? pathname : null;
    if (!abs) {
      errors.push(`${display(from)}: link względny „${raw}” (używaj ścieżek od /)`);
      return;
    }
    if (redirects.has(abs) || redirectPrefixes.some((p) => abs.startsWith(p))) return;
    target = resolveTarget(abs);
    if (!target) {
      const hint = !abs.endsWith('/') && !/\.[a-z0-9]+$/i.test(abs) && resolveTarget(abs + '/') ? ' (brak „/” na końcu)' : '';
      errors.push(`${display(from)}: martwy link ${raw}${hint}`);
      return;
    }
    if (!abs.endsWith('/') && target.endsWith('index.html')) errors.push(`${display(from)}: brak „/” na końcu: ${raw}`);
  }
  if (hash && target && target.endsWith('.html')) {
    const id = decodeURIComponent(hash);
    if (!idsOf(target).has(id)) errors.push(`${display(from)}: brak kotwicy #${id} w ${display(target)}`);
  }
}

const display = (f) => '/' + relative(root, f).split(sep).join('/');
let links = 0;

// cele przekierowań muszą istnieć (bez łańcuchów przekierowań)
for (const to of redirectTargets) {
  links++;
  if (/^https?:\/\//.test(to) && !to.startsWith(SITE)) continue;
  const p = to.startsWith(SITE) ? to.slice(SITE.length) || '/' : to;
  if (p.includes(':splat') || p.includes('*')) continue;
  if (!resolveTarget(p.split('#')[0])) errors.push(`/_redirects: cel ${to} nie istnieje w buildzie`);
}

for (const file of walk(root, new Set(['_astro']))) {
  if (file.endsWith('.html')) {
    const html = read(file);
    for (const m of html.matchAll(/<(a|link|script|img|source|use)\b([^>]*)>/gi)) {
      const attrs = m[2];
      for (const a of attrs.matchAll(/\s(href|src)="([^"]*)"/g)) {
        links++;
        check(file, a[2]);
      }
      const srcset = /\ssrcset="([^"]*)"/.exec(attrs)?.[1];
      if (srcset) for (const part of srcset.split(',')) check(file, part.trim().split(/\s+/)[0]);
    }
  } else if (/\.(md|txt|xml)$/.test(file)) {
    const text = read(file);
    const re = file.endsWith('.xml') ? /<(?:loc|link)>([^<]+)<\/(?:loc|link)>/g : /\]\((https:\/\/www\.auraconsulting\.pl[^)\s]*)\)/g;
    for (const m of text.matchAll(re)) {
      links++;
      check(file, m[1]);
    }
  }
}

report('Linki wewnętrzne', errors, `${links} odnośników sprawdzonych offline`);
