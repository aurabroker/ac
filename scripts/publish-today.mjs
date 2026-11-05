#!/usr/bin/env node
// Harmonogram publikacji artykułów (/wiedza/*) i arkuszy regulacji (/regulacje/*).
//   node scripts/publish-today.mjs           co wchodzi dziś (Europe/Warsaw); w GitHub Actions wynik trafia do GITHUB_OUTPUT
//   node scripts/publish-today.mjs --list    cały harmonogram: data, stan, adres, tytuł
//   node scripts/publish-today.mjs --check   spójność: zatwierdzony wpis nie linkuje w treści (poza `related`)
//                                            do szkicu ani do wpisu z późniejszą datą — taki link byłby martwy
// Reguła publikacji jest ta sama co w buildzie: src/lib/schedule.ts. AURA_TODAY=RRRR-MM-DD — tylko do testów.
// Bez zależności npm (plik .ts czyta Node przez type stripping, Node ≥ 22.18).
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { dayInWarsaw, isPublished, isScheduled, publishToday } from '../src/lib/schedule.ts';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const COLLECTIONS = [
  { dir: 'src/content/wiedza', prefix: '/wiedza/' },
  { dir: 'src/content/regulations', prefix: '/regulacje/' },
];

function* files(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else if (e.isFile() && ['.md', '.mdx'].includes(extname(e.name))) yield p;
  }
}

/** Wartość skalarna klucza najwyższego poziomu (bez parsera YAML: title, published, draft, slug). */
function scalar(yaml, key) {
  const m = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm').exec(yaml);
  if (!m) return undefined;
  const v = m[1].trim();
  const dq = /^"((?:[^"\\]|\\.)*)"/.exec(v);
  if (dq) return JSON.parse(dq[0]);
  const sq = /^'((?:[^']|'')*)'/.exec(v);
  if (sq) return sq[1].replace(/''/g, "'");
  return v.replace(/\s+#.*$/, '');
}

/** Frontmatter bez listy `related` (tam linki do niepublikowanych wpisów są pomijane w buildzie). */
function withoutRelated(yaml) {
  const out = [];
  let skip = false;
  for (const line of yaml.split('\n')) {
    if (/^related:/.test(line)) {
      skip = true;
      continue;
    }
    if (skip && /^(\s|-)/.test(line)) continue;
    skip = false;
    out.push(line);
  }
  return out.join('\n');
}

function loadPosts() {
  const posts = [];
  for (const { dir, prefix } of COLLECTIONS) {
    const abs = join(ROOT, dir);
    for (const file of files(abs)) {
      const src = readFileSync(file, 'utf8');
      const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
      const rel = relative(ROOT, file).split(sep).join('/');
      if (!fm) throw new Error(`${rel}: brak frontmattera`);
      const yaml = fm[1];
      const id = scalar(yaml, 'slug') || relative(abs, file).split(sep).join('/').replace(/\.mdx?$/, '');
      const published = new Date(scalar(yaml, 'published') ?? '');
      if (Number.isNaN(published.getTime())) throw new Error(`${rel}: brak poprawnej daty „published”`);
      posts.push({
        file: rel,
        path: `${prefix}${id}/`,
        title: scalar(yaml, 'title') ?? id,
        published,
        day: dayInWarsaw(published),
        draft: String(scalar(yaml, 'draft') ?? 'false').toLowerCase() === 'true',
        text: withoutRelated(yaml) + '\n' + src.slice(fm[0].length),
      });
    }
  }
  return posts.sort((a, b) => a.day.localeCompare(b.day) || a.path.localeCompare(b.path));
}

function stateOf(p, today) {
  if (p.draft) return p.day < today ? 'szkic, termin minął' : 'szkic';
  return isPublished(p, today) ? 'opublikowany' : 'zaplanowany';
}

const LINK_RE = /(?<=[("'\s=]|auraconsulting\.pl)\/(?:wiedza|regulacje)\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\//g;

function check(posts) {
  const byPath = new Map(posts.map((p) => [p.path, p]));
  const errors = [];
  const warnings = [];
  for (const p of posts) {
    for (const href of new Set(p.text.match(LINK_RE) ?? [])) {
      if (href === p.path) continue;
      const q = byPath.get(href);
      const problem = !q
        ? `linkuje do ${href}, którego nie ma w treściach`
        : !p.draft && q.draft
          ? `linkuje do szkicu ${href}`
          : q.day > p.day
            ? `linkuje do ${href}, publikowanego później (${q.day} > ${p.day})`
            : null;
      if (problem) (p.draft ? warnings : errors).push(`${p.file}: ${problem} — przenieś link do „related” albo zmień daty`);
    }
  }
  for (const w of warnings) console.warn(`  ! ${w}`);
  if (errors.length) {
    console.error(`harmonogram: ${errors.length} błędów`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log(`harmonogram: OK — ${posts.length} wpisów, linki w treści zgodne z datami publikacji`);
}

const posts = loadPosts();
const today = publishToday();
const args = new Set(process.argv.slice(2));

if (args.has('--check')) {
  check(posts);
} else if (args.has('--list')) {
  console.log(`Harmonogram (dziś ${today}, Europe/Warsaw):`);
  for (const p of posts) console.log(`  ${p.day}  ${stateOf(p, today).padEnd(20)} ${p.path.padEnd(42)} ${p.title}`);
} else {
  const due = posts.filter((p) => isPublished(p, today) && p.day === today);
  const later = posts.filter((p) => !p.draft && isScheduled(p, today));
  if (due.length) {
    console.log(`Dziś (${today}) publikacja:`);
    for (const p of due) console.log(`  ${p.path}  ${p.title}`);
  } else {
    console.log(`Dziś (${today}) brak publikacji z harmonogramu.`);
  }
  if (later.length) console.log(`Następna: ${later[0].day} — ${later[0].title}`);
  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    const titles = due.map((p) => p.title.replace(/\s+/g, ' ')).join('; ');
    appendFileSync(out, `count=${due.length}\nmessage=Publikacja: ${titles}\n`);
  }
}
