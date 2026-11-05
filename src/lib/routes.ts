/**
 * Rejestr tras: jedno źródło listy stron dla [...slug].astro, OG, sitemap, llms.txt, llms-full.txt, RSS,
 * bloga, „Powiązanych” i odnośników słownika (linki do stron spoza buildu nie powstają, a `npm run links` je wyłapie).
 * Waliduje: unikalność ścieżek, istnienie hubów i autorów.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { PREVIEW } from './env.ts';
import { publishToday, isPublished, isScheduled } from './schedule.ts';
import { SITE } from './site.ts';
import { MAIN_NAV, SECTION_LABELS } from './nav.ts';
import type { Crumb } from './seo/jsonld.ts';

export type RouteKind = 'page' | 'pillar' | 'solution' | 'article' | 'regulation';

export type PageEntry = CollectionEntry<'pages'>;
export type PillarEntry = CollectionEntry<'pillars'>;
export type SolutionEntry = CollectionEntry<'solutions'>;
export type ArticleEntry = CollectionEntry<'wiedza'>;
export type RegulationEntry = CollectionEntry<'regulations'>;
export type AnyEntry = PageEntry | PillarEntry | SolutionEntry | ArticleEntry | RegulationEntry;

export interface SiteRoute {
  path: string;
  url: string;
  kind: RouteKind;
  entry: AnyEntry;
  draft: boolean;
  /** Artykuł lub arkusz regulacji z datą `published` w przyszłości (w buildzie tylko w podglądzie i dev). */
  scheduled: boolean;
  /** Czy strona trafia do indeksu (sitemap, llms.txt, bliźniak .md). */
  indexable: boolean;
}

const DEV = import.meta.env.DEV;

/** Drafty i wpisy z harmonogramu widoczne tylko w dev lub z PREVIEW=1. */
export const showDrafts = PREVIEW || DEV;

/** „Dziś” w Europe/Warsaw w chwili builda (RRRR-MM-DD). */
export const TODAY = publishToday();
if (process.env.AURA_TODAY) console.warn(`[harmonogram] AURA_TODAY=${TODAY} — data testowa, nie do produkcji`);

const isPost = (e: AnyEntry) => e.collection === 'wiedza' || e.collection === 'regulations';

/**
 * Jedyna reguła publikacji w produkcji. Strona stała: nie jest szkicem. Artykuł i arkusz regulacji:
 * zatwierdzony (`draft: false`) i jego dzień `published` (Europe/Warsaw) już nadszedł (`src/lib/schedule.ts`).
 */
export function isLive(entry: AnyEntry, today: string = TODAY): boolean {
  return isPost(entry) ? isPublished(entry.data, today) : !entry.data.draft;
}

function make(kind: RouteKind, path: string, entry: AnyEntry): SiteRoute {
  const draft = entry.data.draft;
  const scheduled = isPost(entry) && isScheduled(entry.data, TODAY);
  return {
    path,
    url: SITE.url + path,
    kind,
    entry,
    draft,
    scheduled,
    indexable: !draft && !scheduled && !entry.data.noindex && !PREVIEW,
  };
}

let cache: Promise<SiteRoute[]> | null = null;

async function build(): Promise<SiteRoute[]> {
  const visible = <T extends AnyEntry>(e: T) => showDrafts || isLive(e);
  const [pages, pillars, solutions, wiedza, regulations] = await Promise.all([
    getCollection('pages', visible),
    getCollection('pillars', visible),
    getCollection('solutions', visible),
    getCollection('wiedza', visible),
    getCollection('regulations', visible),
  ]);
  const routes: SiteRoute[] = [
    ...pages.map((e) => make('page', e.data.path, e)),
    ...pillars.map((e) => make('pillar', `/${e.id}/`, e)),
    ...solutions.map((e) => make('solution', `/ubezpieczenia/${e.id}/`, e)),
    ...wiedza.map((e) => make('article', `/wiedza/${e.id}/`, e)),
    ...regulations.map((e) => make('regulation', `/regulacje/${e.id}/`, e)),
  ];

  // unikalność ścieżek
  const seen = new Map<string, string>();
  for (const r of routes) {
    const who = `${r.entry.collection}/${r.entry.id}`;
    const prev = seen.get(r.path);
    if (prev) throw new Error(`Dwie strony pod tym samym adresem ${r.path}: ${prev} i ${who}`);
    seen.set(r.path, who);
  }

  // autorzy i huby
  for (const r of routes) {
    const author = r.entry.data.author;
    if (!(await getEntry('people', author))) {
      throw new Error(`${r.entry.collection}/${r.entry.id}: autor „${author}” nie istnieje w src/content/people.yaml`);
    }
    if (r.kind === 'article') {
      const hub = (r.entry as ArticleEntry).data.hub;
      if (!seen.has(hub)) throw new Error(`wiedza/${r.entry.id}: hub ${hub} nie istnieje (lub jest szkicem)`);
    }
  }

  routes.sort((a, b) => a.path.localeCompare(b.path, 'pl'));
  return routes;
}

export function getRoutes(): Promise<SiteRoute[]> {
  cache ??= build();
  return cache;
}

export async function getRoute(path: string): Promise<SiteRoute | undefined> {
  return (await getRoutes()).find((r) => r.path === path);
}

/** Ścieżki istniejące w tym buildzie (do filtrowania linków „powiązane”). */
export async function existingPaths(): Promise<Set<string>> {
  return new Set((await getRoutes()).map((r) => r.path));
}

export function breadcrumbsFor(route: SiteRoute): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Start', href: '/' }];
  if (route.path === '/') return crumbs;
  if (route.kind === 'pillar' && route.entry.id.includes('/')) {
    // segment filaru, np. /oc-cyber-dla-it/software-house/ → rodzic: filar
    const parentHref = `/${route.entry.id.split('/')[0]}/`;
    const nav = MAIN_NAV.find((l) => l.href === parentHref);
    crumbs.push({ label: nav?.label ?? parentHref.replace(/\//g, ''), href: parentHref });
  }
  if (route.kind === 'solution') crumbs.push(SECTION_LABELS.solutions);
  if (route.kind === 'article') crumbs.push(SECTION_LABELS.wiedza);
  if (route.kind === 'regulation') crumbs.push(SECTION_LABELS.regulations);
  if (route.kind === 'page') {
    const parent = (route.entry as PageEntry).data.breadcrumbParent;
    if (parent) crumbs.push({ label: parent.title, href: parent.path });
  }
  crumbs.push({ label: shortTitle(route.entry.data.title), href: route.path });
  return crumbs;
}

export function shortTitle(t: string): string {
  const s = t.split(/[:?—–]/)[0].trim();
  return s.length >= 3 ? s : t;
}

/** Artykuły (opublikowane lub — w podglądzie — wszystkie) przypisane do huba. */
export async function articlesForHub(hubPath: string): Promise<SiteRoute[]> {
  return (await getRoutes())
    .filter((r) => r.kind === 'article' && (r.entry as ArticleEntry).data.hub === hubPath)
    .sort((a, b) => b.entry.data.published.getTime() - a.entry.data.published.getTime());
}

/**
 * Data ostatniej zmiany strony dla sitemap (`lastmod`) i JSON-LD (`WebPage.dateModified`): `updated`,
 * a na stronach z listą artykułów (blog `/wiedza/`, huby z „Arkuszami szczegółowymi”) — nowsza z `updated`
 * i dnia publikacji najnowszego opublikowanego wpisu na tej liście (harmonogram zmienia stronę bez edycji pliku).
 */
export async function lastModified(route: SiteRoute): Promise<Date> {
  const own = route.entry.data.updated;
  const listed =
    (route.entry.data as { template?: string }).template === 'wiedza-index'
      ? (await getRoutes()).filter((r) => r.kind === 'article' || r.kind === 'regulation')
      : await articlesForHub(route.path);
  return listed
    .filter((r) => isLive(r.entry))
    .reduce((m, r) => (r.entry.data.published > m ? r.entry.data.published : m), own);
}
