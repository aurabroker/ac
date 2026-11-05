/**
 * Treść strony → rysunek izometryczny (motyw, wariant, podpisy, tabliczka, czerwony podpis, opis dostępny).
 * Motyw i wariant: tabela MOTIF_BY_PATH (src/lib/iso/pages.ts), dla nowych stron — rodzina z sekcji (fallbackPlan).
 * Podpisy pochodzą z treści tej strony: moduły z tabeli zakresu (`coverage[].module`), hasła słownika,
 * specjalizacje osoby, działy bloga; tabela albo frontmatter `iso` ustala kolejność slotów motywu.
 * Frontmatter `iso` nadpisuje wszystko (CONVENTIONS §5), `iso: false` wyłącza rysunek w nagłówku.
 * Na rysunkach nie ma liczb ani statystyk; czerwień = jedno konkretne wyłączenie z tabeli zakresu.
 */
import { getCollection } from 'astro:content';
import { HAS_NUMBER, LABEL_MAX, type MotifId } from './scene.ts';
import { MOTIFS, resolveVariant } from './motifs/index.ts';
import { MOTIF_BY_PATH, fallbackPlan, type RouteHint } from './pages.ts';
import type { IsoSpec } from './render.ts';
import { MAIN_NAV } from '../nav.ts';
import { getPerson } from '../people.ts';
import { shortTitle, type PageEntry, type SiteRoute } from '../routes.ts';
import { ogKeyFor } from '../site.ts';

/** Miniatura strony (plik SVG z builda, src/pages/fig/[...key].svg.ts): `/` → `/fig/index.svg`. */
export const figPathFor = (pagePath: string) => `/fig/${ogKeyFor(pagePath)}.svg`;

export interface IsoOverride {
  motif?: MotifId;
  variant?: string;
  labels?: string[];
  inputs?: string[];
  plate?: string;
  fault?: string | false;
}

const EXCLUDED_MODULE = /^wyłączeni/i;
const GENERIC = /^(inne|rozszerzenie|koszty)$/i;

/** Etykieta z nazwy modułu/nagłówka: bez nawiasów i znaku zapytania, bez liczb (scene.HAS_NUMBER), ≤ 28 znaków. */
export function cleanLabel(s: string): string | null {
  let t = s
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[?„”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  t = t.replace(/\s+\d+(?:[.,]\d+)?$/, '');
  if (t.length > LABEL_MAX && t.includes(' / ')) t = t.split(' / ')[0];
  if (t.length > LABEL_MAX && t.includes(' — ')) t = t.split(' — ')[0];
  if (t.length > LABEL_MAX && t.includes(', ')) t = t.split(', ')[0];
  if (t.length < 2 || t.length > LABEL_MAX) return null;
  if (HAS_NUMBER.test(t)) return null;
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

type CoverageRow = { module?: string; label: string; event?: string };

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

const isExcluded = (c: CoverageRow) => c.label === 'excluded' || (!!c.module && EXCLUDED_MODULE.test(c.module));

/**
 * Czerwony podpis strony spoza tabeli MOTIF_BY_PATH: pierwsze wyłączenie z tabeli zakresu, którego zdarzenie
 * mieści się w podpisie (cleanLabel: ≤ 28 znaków, bez liczb). Nigdy ogólne „Wyłączenia” — brak takiego wiersza
 * = brak czerwieni (wtedy `iso.fault` we frontmatterze).
 */
const exclusionLabel = (coverage: CoverageRow[]): string | undefined => {
  for (const c of coverage) if (isExcluded(c) && c.event) {
    const t = cleanLabel(c.event);
    if (t) return t;
  }
  return undefined;
};

/** Krótkie nagłówki H2 z treści (np. „Kim jesteśmy?” → „Kim jesteśmy”). */
function headings(body: string | undefined, max = 22): string[] {
  const out: string[] = [];
  for (const m of (body ?? '').matchAll(/^##\s+(.+?)\s*$/gm)) {
    const t = cleanLabel(m[1].replace(/[*_`[\]]/g, ''));
    if (t && t.length <= max) out.push(t);
  }
  return uniq(out);
}

/** Rysunek w nagłówku: tylko tam, gdzie strona nie ma innej grafiki i nie jest stroną prawną ani główną. */
export function showsHeaderIso(route: SiteRoute): boolean {
  const d = route.entry.data as { iso?: IsoOverride | false; figure?: string; template?: string };
  if (d.iso === false || d.figure) return false;
  if (MOTIF_BY_PATH[route.path]?.calm) return false;
  if (route.kind === 'page') return !['home', 'legal', 'catalogue-index'].includes(d.template ?? '');
  return true;
}

const pillarNav = () => MAIN_NAV.filter((l) => /^\/(oc-|ubezpieczenie-)/.test(l.href)).map((l) => l.label);

/** Podpisy z treści strony, gdy ani frontmatter, ani tabela ich nie ustala. */
async function autoLabels(route: SiteRoute, cov: CoverageRow[]): Promise<string[]> {
  const d = route.entry.data as PageEntry['data'];
  if (route.kind === 'page') {
    const t = d.template;
    if (t === 'home' || t === 'wiedza-index' || t === 'catalogue-index') return pillarNav();
    if (t === 'glossary') {
      // pojęcia, od których zależy, czy roszczenie trafi do polisy (wstęp strony słownika)
      const core = ['claims-made', 'data-retroaktywna', 'suma-gwarancyjna', 'udzial-wlasny'];
      const terms = await getCollection('glossary');
      return core.map((id) => terms.find((e) => e.data.id === id)?.data.term).filter((s): s is string => !!s);
    }
    if (t === 'person') {
      const person = await getPerson(d.person ?? d.author);
      return uniq(person.knowsAbout.map((s) => cleanLabel(s.split(' — ')[0])));
    }
  }
  const mods = modules(cov);
  return mods.length ? mods : headings(route.entry.body);
}

function hintFor(route: SiteRoute): RouteHint {
  const d = route.entry.data as { template?: string; group?: string; hub?: string; pillar?: string };
  return { kind: route.kind, path: route.path, template: d.template, group: d.group, hub: d.hub, pillar: d.pillar };
}

export async function isoSpecFor(route: SiteRoute): Promise<IsoSpec> {
  const d = route.entry.data as PageEntry['data'] & { iso?: IsoOverride | false; coverage: CoverageRow[] };
  const o: IsoOverride = d.iso || {};
  const cov = d.coverage ?? [];
  const inTable = route.path in MOTIF_BY_PATH;
  const plan = MOTIF_BY_PATH[route.path] ?? fallbackPlan(hintFor(route));
  const motif: MotifId = o.motif ?? plan.motif;
  // frontmatter zmienia motyw → wariant z frontmattera albo domyślny nowego motywu
  const variant = resolveVariant(motif, o.variant ?? (motif === plan.motif ? plan.variant : undefined));
  const calm = !!plan.calm || d.template === 'legal';

  let labels = o.labels ?? plan.labels ?? (await autoLabels(route, cov));
  let inputs = o.inputs ?? plan.inputs ?? [];
  let fault: string | undefined = o.fault === false ? undefined : (o.fault ?? plan.fault ?? (!inTable ? exclusionLabel(cov) : undefined));
  let plate = o.plate ?? plan.plate;
  if (calm) {
    labels = [];
    inputs = [];
    fault = undefined;
    plate = undefined;
  }

  const up = (s: string) => s.toLocaleUpperCase('pl');
  return {
    motif,
    variant,
    labels: labels.map(up),
    inputs: inputs.map(up),
    plate: plate ? up(plate) : undefined,
    fault: fault ? up(fault) : undefined,
    calm,
    title: `${MOTIFS[motif].name}: ${shortTitle(d.title)}`,
    // opis powstaje w render.ts osobno dla każdego kadru — tylko z podpisami, które kadr pokazuje
    about: { variant, labels, inputs, fault, calm },
  };
}
