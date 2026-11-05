/**
 * Treść strony → rysunek izometryczny (motyw, etykiety, napis na obudowie, czerwony akcent).
 * Etykiety pochodzą z treści tej strony: moduły z tabeli zakresu (`coverage[].module`), krótkie nagłówki H2,
 * specjalizacje osoby, hasła słownika, działy bloga. Frontmatter `iso` nadpisuje wybór (CONVENTIONS §6),
 * `iso: false` wyłącza rysunek. Na rysunkach nie ma liczb ani statystyk.
 */
import { getCollection } from 'astro:content';
import { hash } from './geom.ts';
import type { Motif } from './motifs.ts';
import type { IsoSpec } from './render.ts';
import { MAIN_NAV } from '../nav.ts';
import { getPerson } from '../people.ts';
import { shortTitle, type PageEntry, type SiteRoute } from '../routes.ts';
import { ogKeyFor } from '../site.ts';

/** Miniatura strony (plik SVG z builda, src/pages/fig/[...key].svg.ts): `/` → `/fig/index.svg`. */
export const figPathFor = (pagePath: string) => `/fig/${ogKeyFor(pagePath)}.svg`;

export interface IsoOverride {
  motif?: Motif;
  labels?: string[];
  inputs?: string[];
  chip?: string;
  fault?: string | false;
}

const EXCLUDED_MODULE = /^wyłączeni/i;
const GENERIC = /^(inne|rozszerzenie|koszty)$/i;

/** Etykieta z nazwy modułu/nagłówka: bez nawiasów i znaku zapytania, bez liczb, ≤ 28 znaków. */
export function cleanLabel(s: string): string | null {
  let t = s
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[?„”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  t = t.replace(/\s+\d+(?:[.,]\d+)?$/, '');
  if (t.length > 28 && t.includes(' / ')) t = t.split(' / ')[0];
  if (t.length > 28 && t.includes(' — ')) t = t.split(' — ')[0];
  if (t.length < 2 || t.length > 28) return null;
  if (/\d{2,}|%|\d[.,]\d/.test(t)) return null;
  return t;
}

const uniq = (arr: (string | null | undefined)[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    if (!s) continue;
    const key = s.toLocaleLowerCase('pl');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
};

type CoverageRow = { module?: string; label: string };

/** Moduły z tabeli zakresu: najpierw „zwykle w zakresie”, potem opcjonalne i zależne od oceny ryzyka. */
function modules(coverage: CoverageRow[]): string[] {
  const rank: Record<string, number> = { typical: 0, optional: 1, underwriting: 2 };
  const rows = coverage
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.module && c.label !== 'excluded' && !EXCLUDED_MODULE.test(c.module))
    .sort((a, b) => (rank[a.c.label] ?? 3) - (rank[b.c.label] ?? 3) || a.i - b.i);
  const named = rows.map(({ c }) => cleanLabel(c.module!));
  return uniq([...named.filter((t) => t && !GENERIC.test(t)), ...named.filter((t) => t && GENERIC.test(t))]);
}

const hasExclusions = (coverage: CoverageRow[]) =>
  coverage.some((c) => c.label === 'excluded' || (c.module && EXCLUDED_MODULE.test(c.module)));

/** Krótkie nagłówki H2 z treści (np. „Kim jesteśmy?” → „Kim jesteśmy”). */
function headings(body: string | undefined, max = 22): string[] {
  const out: string[] = [];
  for (const m of (body ?? '').matchAll(/^##\s+(.+?)\s*$/gm)) {
    const t = cleanLabel(m[1].replace(/[*_`[\]]/g, ''));
    if (t && t.length <= max) out.push(t);
  }
  return uniq(out);
}

/** Napis na obudowie: skrót z nawiasu („(D&O)”) albo krótki człon przed dwukropkiem („LLMjacking: …”). */
function chipFor(title: string): string | undefined {
  const paren = /\(([^)]{2,12})\)/.exec(title)?.[1];
  if (paren) return paren;
  const head = title.split(':')[0].trim();
  if (head !== title.trim()) {
    const t = head.replace(/\s+\d+(?:[.,]\d+)?$/, '');
    if (t.length <= 14 && !/\d{2,}/.test(t)) return t;
  }
  return undefined;
}

const pickBy = (seed: string, options: Motif[]) => options[hash(seed) % options.length];

/** Rysunek w nagłówku: tylko tam, gdzie strona nie ma innej grafiki i nie jest stroną prawną ani główną. */
export function showsHeaderIso(route: SiteRoute): boolean {
  const d = route.entry.data as { iso?: IsoOverride | false; figure?: string; template?: string };
  if (d.iso === false || d.figure) return false;
  if (route.kind === 'page') return !['home', 'legal', 'catalogue-index'].includes(d.template ?? '');
  return true;
}

export async function isoSpecFor(route: SiteRoute): Promise<IsoSpec> {
  const d = route.entry.data as PageEntry['data'] & { iso?: IsoOverride | false; coverage: CoverageRow[] };
  const o: IsoOverride = d.iso || {};
  const seed = route.path;
  const cov = d.coverage ?? [];
  let motif: Motif = 'stack';
  let labels: string[] = modules(cov);
  let inputs: string[] = [];
  let chip = chipFor(d.title);
  let fault: string | undefined = hasExclusions(cov) ? 'Wyłączenia' : undefined;
  let calm = false;

  switch (route.kind) {
    case 'solution':
      motif = pickBy(seed, ['stack', 'pcb']);
      break;
    case 'article':
      motif = pickBy(seed, ['bga', 'qfp']);
      break;
    case 'regulation':
      motif = 'stack';
      chip = undefined;
      break;
    case 'pillar':
      motif = route.entry.id.includes('/') ? 'stack' : 'qfp';
      chip = undefined;
      break;
    case 'page': {
      const t = d.template;
      chip = undefined;
      if (t === 'contact') {
        motif = 'pcb';
        inputs = ['Analiza ryzyka', 'Zgłoszenie szkody'];
        labels = ['Formularz', 'Telefon'];
        chip = 'Broker';
      } else if (t === 'person') {
        motif = 'qfp';
        const person = await getPerson(d.person ?? d.author);
        labels = uniq(person.knowsAbout.map((s) => cleanLabel(s.split(' — ')[0])));
      } else if (t === 'wiedza-index') {
        motif = 'bga';
        labels = MAIN_NAV.filter((l) => /^\/(oc-|ubezpieczenie-)/.test(l.href)).map((l) => l.label);
        chip = 'Wiedza';
      } else if (t === 'glossary') {
        motif = 'bga';
        // pojęcia, od których zależy, czy roszczenie trafi do polisy (wstęp strony słownika)
        const core = ['claims-made', 'data-retroaktywna', 'suma-gwarancyjna', 'udzial-wlasny'];
        const terms = await getCollection('glossary');
        labels = core.map((id) => terms.find((e) => e.data.id === id)?.data.term).filter((s): s is string => !!s);
        chip = 'A–Z';
      } else if (t === 'catalogue-index') {
        motif = 'bga';
        labels = MAIN_NAV.filter((l) => /^\/(oc-|ubezpieczenie-)/.test(l.href)).map((l) => l.label);
      } else if (t === 'home') {
        motif = 'stack';
        labels = MAIN_NAV.filter((l) => /^\/(oc-|ubezpieczenie-)/.test(l.href)).map((l) => l.label);
      } else {
        motif = 'stack';
        calm = t === 'legal';
        // strony prawne: spokojna miniatura bez podpisów i bez akcentów
        if (calm) {
          labels = [];
          fault = undefined;
        } else if (!labels.length) labels = headings(route.entry.body);
      }
    }
  }

  if (o.motif) motif = o.motif;
  if (o.labels) labels = o.labels;
  if (o.inputs) inputs = o.inputs;
  if (o.chip !== undefined) chip = o.chip || undefined;
  if (o.fault === false) fault = undefined;
  else if (o.fault) fault = o.fault;
  if (motif === 'pcb' && !inputs.length) {
    // karta jako przebieg: dwa pierwsze moduły wchodzą, pozostałe wychodzą
    inputs = labels.slice(0, 2);
    labels = labels.slice(2);
  }

  const up = (s: string) => s.toLocaleUpperCase('pl');
  const name = shortTitle(d.title);
  const shown = labels.slice(0, 4);
  const list = (a: string[]) => a.map((s) => s.toLocaleLowerCase('pl')).join(', ');
  const faultNote = fault ? ` Czerwienią oznaczono: ${fault.toLocaleLowerCase('pl')}.` : '';
  const desc =
    motif === 'stack'
      ? `Układ scalony w widoku rozstrzelonym, warstwy od góry: ${list([...(fault ? [fault] : []), ...shown])}.`
      : motif === 'qfp'
        ? `Obudowa układu scalonego nad płytką drukowaną${shown.length ? `; podpisane wyprowadzenia: ${list(shown)}` : ''}.${faultNote}`
        : motif === 'pcb'
          ? `Ścieżki płytki drukowanej prowadzą przez układ${inputs.length ? ` od: ${list(inputs)}` : ''}${shown.length ? ` do: ${list(shown)}` : ''}.${fault ? ` Przerwana ścieżka: ${fault.toLocaleLowerCase('pl')}.` : ''}`
          : `Matryca kulek pod rdzeniem układu scalonego${shown.length ? `; wyróżnione pola: ${list(shown)}` : ''}.${faultNote}`;

  return {
    seed,
    motif,
    labels: labels.map(up),
    inputs: inputs.map(up),
    chip: chip ? up(chip) : undefined,
    fault: fault ? up(fault) : undefined,
    calm,
    title: `Rysunek: ${name} jako układ scalony`,
    desc,
  };
}
