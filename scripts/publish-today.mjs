#!/usr/bin/env node
// Harmonogram publikacji artykułów (/wiedza/*) i arkuszy regulacji (/regulacje/*).
//   node scripts/publish-today.mjs              co wchodzi dziś (Europe/Warsaw), także zaległe zatwierdzone wpisy, których
//                                               dzień minął bez nowego builda; w GitHub Actions wynik trafia do GITHUB_OUTPUT
//   node scripts/publish-today.mjs --list       cały harmonogram: data, stan, adres, tytuł
//   node scripts/publish-today.mjs --check      spójność (krok w CI):
//        - zatwierdzony wpis nie linkuje w treści (poza `related`) do szkicu ani do wpisu z późniejszą datą,
//        - data publikacji nie jest wsteczna: `published` zatwierdzonego wpisu ≥ dzień commita, który ustawił
//          `draft: false` (na `main`: dzień scalenia; historia git musi być pełna — w CI `fetch-depth: 0`),
//        - `legalStateAsOf` ≤ `published`; ostrzeżenie, gdy stan prawny jest starszy niż 14 dni w dniu publikacji.
//   node scripts/publish-today.mjs --reschedule [--from=RRRR-MM-DD] [--dry-run]
//        przenosi szkice po terminie (i zatwierdzone wpisy z datą wsteczną) na najbliższe wolne terminy co 2 dni
//        od dziś (albo od --from, np. dnia startu), z zachowaniem kolejności; dalsze wpisy przesuwa tylko do przodu.
//        Ustawia `published` (i `updated`, jeśli był wcześniejszy) w plikach treści.
// Reguła publikacji jest ta sama co w buildzie: src/lib/schedule.ts. AURA_TODAY=RRRR-MM-DD — tylko do testów.
// Bez zależności npm (plik .ts czyta Node przez type stripping, Node ≥ 22.18).
import { execFileSync } from 'node:child_process';
import { appendFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { dayInWarsaw, isPublished, isScheduled, publishToday } from '../src/lib/schedule.ts';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const COLLECTIONS = [
  { dir: 'src/content/wiedza', prefix: '/wiedza/' },
  { dir: 'src/content/regulations', prefix: '/regulacje/' },
];
/** Odstęp między kolejnymi publikacjami (dni). */
const GAP = 2;
/** Po ilu dniach od `legalStateAsOf` arkusz wymaga ponownego sprawdzenia przepisów przed publikacją. */
const LEGAL_MAX_AGE = 14;

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

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const dayOf = (v) => {
  const d = new Date(v ?? '');
  return Number.isNaN(d.getTime()) ? undefined : dayInWarsaw(d);
};

function loadPosts() {
  const posts = [];
  for (const { dir, prefix } of COLLECTIONS) {
    const abs = join(ROOT, dir);
    for (const file of files(abs)) {
      const src = readFileSync(file, 'utf8');
      const fm = FM_RE.exec(src);
      const rel = relative(ROOT, file).split(sep).join('/');
      if (!fm) throw new Error(`${rel}: brak frontmattera`);
      const yaml = fm[1];
      const id = scalar(yaml, 'slug') || relative(abs, file).split(sep).join('/').replace(/\.mdx?$/, '');
      const published = new Date(scalar(yaml, 'published') ?? '');
      if (Number.isNaN(published.getTime())) throw new Error(`${rel}: brak poprawnej daty „published”`);
      posts.push({
        file: rel,
        abs: file,
        path: `${prefix}${id}/`,
        title: scalar(yaml, 'title') ?? id,
        published,
        day: dayInWarsaw(published),
        updatedDay: dayOf(scalar(yaml, 'updated')),
        legalDay: dayOf(scalar(yaml, 'legalStateAsOf')),
        draft: String(scalar(yaml, 'draft') ?? 'false').toLowerCase() === 'true',
        text: withoutRelated(yaml) + '\n' + src.slice(fm[0].length),
      });
    }
  }
  return posts.sort((a, b) => a.day.localeCompare(b.day) || a.path.localeCompare(b.path));
}

/* ---------- git: kiedy wpis zatwierdzono ---------- */

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** Czy da się ustalić dzień zatwierdzenia: repozytorium git z pełną historią. Zwraca powód, gdy nie. */
function gitHistoryProblem() {
  if (git(['rev-parse', '--is-inside-work-tree']) !== 'true') return 'brak repozytorium git';
  if (git(['rev-parse', '--is-shallow-repository']) === 'true') return 'płytki klon (w CI: actions/checkout z fetch-depth: 0)';
  return null;
}

const DRAFT_FALSE_RE = /^draft:[ \t]*false\b/m;

/**
 * Dzień zatwierdzenia wpisu (`draft: false`): zmiana jeszcze niezacommitowana — dziś; inaczej dzień commita,
 * który ją wprowadził, na ścieżce pierwszych rodziców (na `main` — commit scalenia, czyli dzień wejścia na `main`).
 */
function approvalDay(p, today) {
  const head = git(['show', `HEAD:${p.file}`]);
  const headFm = head === null ? null : FM_RE.exec(head)?.[1];
  if (!headFm || !DRAFT_FALSE_RE.test(headFm)) return today;
  const at = git(['log', '-1', '--first-parent', '--format=%cI', '-S', 'draft: false', '--', p.file]);
  return at ? dayInWarsaw(new Date(at)) : null;
}

/** Dzień ostatniego commita (HEAD) — ostatni build produkcji, gdy skrypt działa na `main`. */
function headDay() {
  const at = git(['log', '-1', '--format=%cI']);
  return at ? dayInWarsaw(new Date(at)) : null;
}

/* ---------- daty ---------- */

const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

function stateOf(p, today) {
  if (p.draft) return p.day < today ? 'szkic, termin minął' : 'szkic';
  return isPublished(p, today) ? 'opublikowany' : 'zaplanowany';
}

/* ---------- --check ---------- */

const LINK_RE = /(?<=[("'\s=]|auraconsulting\.pl)\/(?:wiedza|regulacje)\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\//g;

function check(posts, today) {
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
    if (p.legalDay) {
      if (p.legalDay > p.day) {
        (p.draft ? warnings : errors).push(`${p.file}: legalStateAsOf ${p.legalDay} jest późniejszy niż published ${p.day}`);
      } else if (!p.draft && daysBetween(p.legalDay, p.day) > LEGAL_MAX_AGE) {
        warnings.push(
          `${p.file}: stan prawny na ${p.legalDay}, publikacja ${p.day} (${daysBetween(p.legalDay, p.day)} dni) — sprawdź przepisy ponownie i ustaw legalStateAsOf (oraz daty dostępu zmienionych źródeł) na dzień sprawdzenia`,
        );
      }
    }
    if (p.draft && p.day < today) warnings.push(`${p.file}: szkic po terminie (${p.day}) — przed zatwierdzeniem: node scripts/publish-today.mjs --reschedule`);
  }

  // daty wsteczne: zatwierdzenie później niż dzień publikacji
  const approved = posts.filter((p) => !p.draft);
  if (approved.length) {
    const problem = gitHistoryProblem();
    if (problem) {
      warnings.push(`daty publikacji: nie sprawdzono dnia zatwierdzenia (${problem})`);
    } else {
      for (const p of approved) {
        const day = approvalDay(p, today);
        if (day && p.day < day) {
          errors.push(
            `${p.file}: zatwierdzony ${day}, a published = ${p.day} — data publikacji byłaby wsteczna; przesuń published/updated na najbliższy wolny termin: node scripts/publish-today.mjs --reschedule`,
          );
        }
      }
    }
  }

  for (const w of warnings) console.warn(`  ! ${w}`);
  if (errors.length) {
    console.error(`harmonogram: ${errors.length} błędów`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log(`harmonogram: OK — ${posts.length} wpisów, linki w treści i daty publikacji zgodne`);
}

/* ---------- --reschedule ---------- */

function setField(src, key, value) {
  const fm = FM_RE.exec(src);
  const re = new RegExp(`^${key}:[ \\t]*.*$`, 'm');
  if (!re.test(fm[1])) throw new Error(`brak pola ${key}`);
  return src.slice(0, fm.index) + fm[0].replace(re, `${key}: ${value}`) + src.slice(fm.index + fm[0].length);
}

function reschedule(posts, today, from, dryRun) {
  const start = from && from > today ? from : today;
  const canCheckGit = !gitHistoryProblem();
  // zatwierdzone wpisy z datą wsteczną (jak w --check) traktujemy jak szkice po terminie
  const backdated = new Set(
    canCheckGit ? posts.filter((p) => !p.draft && isPublished(p, today) && (approvalDay(p, today) ?? '') > p.day).map((p) => p.path) : [],
  );
  const live = posts.filter((p) => isPublished(p, today) && !backdated.has(p.path));
  const queue = posts.filter((p) => !live.includes(p));
  const lastLive = live.reduce((m, p) => (p.day > m ? p.day : m), '');
  let slot = lastLive && addDays(lastLive, GAP) > start ? addDays(lastLive, GAP) : start;

  const moves = [];
  for (const p of queue) {
    const overdue = p.day < start || backdated.has(p.path);
    const day = overdue || p.day < slot ? slot : p.day;
    if (day !== p.day) moves.push({ p, day });
    slot = addDays(day, GAP);
  }
  if (!moves.length) {
    console.log(`Harmonogram bez zmian (pierwszy wolny termin: ${start}).`);
    return;
  }
  console.log(`${dryRun ? 'Propozycja' : 'Nowe terminy'} (od ${start}, co ${GAP} dni):`);
  for (const { p, day } of moves) {
    console.log(`  ${p.day} → ${day}  ${p.path}`);
    if (dryRun) continue;
    let src = readFileSync(p.abs, 'utf8');
    src = setField(src, 'published', day);
    if (!p.updatedDay || p.updatedDay < day) src = setField(src, 'updated', day);
    writeFileSync(p.abs, src);
  }
  if (!dryRun) console.log('Zaktualizuj tabelę w docs/TODO-wlasciciel.md §3b (node scripts/publish-today.mjs --list).');
}

/* ---------- main ---------- */

const posts = loadPosts();
const today = publishToday();
const argv = process.argv.slice(2);
const args = new Set(argv);
const from = argv.find((a) => a.startsWith('--from='))?.slice('--from='.length);
if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new Error(`--from: oczekiwano RRRR-MM-DD, jest „${from}”`);

if (args.has('--check')) {
  check(posts, today);
} else if (args.has('--reschedule')) {
  reschedule(posts, today, from, args.has('--dry-run'));
} else if (args.has('--list')) {
  console.log(`Harmonogram (dziś ${today}, Europe/Warsaw):`);
  for (const p of posts) console.log(`  ${p.day}  ${stateOf(p, today).padEnd(20)} ${p.path.padEnd(42)} ${p.title}`);
} else {
  // Do publikacji: zatwierdzone wpisy z dniem ≤ dziś, których dzień przypadł po ostatnim commicie (ostatnim buildzie)
  // — dzisiejszy i zaległe, gdy codzienny job się nie odbył. Bez git: tylko dzisiejsze.
  const lastBuild = headDay() ?? addDays(today, -1);
  const due = posts.filter((p) => isPublished(p, today) && p.day > lastBuild);
  const later = posts.filter((p) => !p.draft && isScheduled(p, today));
  if (due.length) {
    console.log(`Dziś (${today}) publikacja:`);
    for (const p of due) console.log(`  ${p.path}  ${p.title}${p.day < today ? ` (zaległa z ${p.day})` : ''}`);
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
