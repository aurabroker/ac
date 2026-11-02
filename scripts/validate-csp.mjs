#!/usr/bin/env node
// Zgodność HTML z CSP z public/_headers (script-src 'self'; style-src 'self'):
//  - brak inline <script> (poza type="application/ld+json"), brak <style>, brak atrybutów style= i on*=,
//  - skrypty i arkusze tylko z tej samej domeny (ścieżki /…),
//  - brak javascript: w linkach.
// Do tego: _headers ma ≤ 100 reguł i zawiera Content-Security-Policy.
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { outDir, walk, read, report } from './lib/dist.mjs';

const root = outDir();
const errors = [];
let files = 0;

for (const file of walk(root, new Set(['_astro', 'og']))) {
  if (!file.endsWith('.html')) continue;
  files++;
  const rel = file.slice(root.length);
  const html = read(file);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1];
    if (/type="application\/ld\+json"/.test(attrs)) continue;
    const src = /\bsrc="([^"]+)"/.exec(attrs)?.[1];
    if (!src) errors.push(`${rel}: inline <script> (zabronione przez CSP)`);
    else if (!src.startsWith('/') || src.startsWith('//')) errors.push(`${rel}: zewnętrzny skrypt ${src}`);
  }
  if (/<style[\s>]/.test(html)) errors.push(`${rel}: inline <style> (zabronione przez CSP)`);
  for (const m of html.matchAll(/<[a-z][^>]*\sstyle="[^"]*"/gi)) errors.push(`${rel}: atrybut style= (${m[0].slice(0, 60)}…)`);
  for (const m of html.matchAll(/<[a-z][^>]*\son[a-z]+="/gi)) errors.push(`${rel}: atrybut on*= (${m[0].slice(0, 60)}…)`);
  if (/href="javascript:/i.test(html)) errors.push(`${rel}: link javascript:`);
  for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)) {
    if (!m[1].startsWith('/') || m[1].startsWith('//')) errors.push(`${rel}: zewnętrzny arkusz ${m[1]}`);
  }
}

const headersFile = join(root, '_headers');
if (!existsSync(headersFile)) errors.push('_headers: brak pliku');
else {
  const h = read(headersFile);
  const rules = h.split('\n').filter((l) => l && !/^\s/.test(l) && !l.startsWith('#')).length;
  if (rules > 100) errors.push(`_headers: ${rules} reguł (limit 100)`);
  if (!/Content-Security-Policy:/.test(h)) errors.push('_headers: brak Content-Security-Policy');
  if (!/^\/\*\.md$/m.test(h)) errors.push('_headers: brak reguły /*.md');
}
if (!existsSync(join(root, '_redirects'))) errors.push('_redirects: brak pliku');

report('CSP/nagłówki', errors, `${files} plików HTML`);
