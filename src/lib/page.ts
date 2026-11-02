/**
 * Kontekst strony: wszystko, czego layout potrzebuje do <head>, tabliczki, okruszków i JSON-LD.
 * Jedno miejsce decyzji o typach schema.org per rodzaj strony (PLAN §4.4).
 */
import { SITE, absoluteUrl, mdPathFor, ogKeyFor } from './site.ts';
import { getPerson, displayName, type Person } from './people.ts';
import { breadcrumbsFor, shortTitle, type SiteRoute, type PageEntry, type PillarEntry } from './routes.ts';
import {
  organizationNode,
  websiteNode,
  webPageNode,
  breadcrumbNode,
  serviceNode,
  faqNode,
  articleNode,
  personNode,
  authorIdFor,
  graph,
  type Crumb,
  type JsonLdNode,
  type WebPageType,
} from './seo/jsonld.ts';
import { stripInlineMd } from './seo/jsonld.ts';

export interface PageContext {
  route: SiteRoute;
  path: string;
  url: string;
  title: string;
  /** Pełny <title>. */
  seoTitle: string;
  description: string;
  ogTitle: string;
  ogImage: string;
  /** Ścieżka bliźniaka .md (null dla stron z noindex). */
  mdPath: string | null;
  noindex: boolean;
  draft: boolean;
  crumbs: Crumb[];
  person: Person;
  authorName: string;
  jsonld: Record<string, unknown>;
}

const PILLAR_SERVICE: Record<PillarEntry['data']['pillar'], string> = {
  it: 'Pośrednictwo ubezpieczeniowe: OC zawodowe i ubezpieczenie cyber dla firm IT',
  ai: 'Pośrednictwo ubezpieczeniowe: OC i ubezpieczenie cyber dla firm tworzących AI',
  cyber: 'Pośrednictwo ubezpieczeniowe: ubezpieczenie cyber dla firm',
  pi: 'Pośrednictwo ubezpieczeniowe: OC zawodowe dla firm usługowych',
};

/** @id haseł słownika linkowanych w treści i frontmatterze (FAQ, tabela zakresu) — dla `mentions`. */
function glossaryMentions(route: SiteRoute): string[] {
  const text = (route.entry.body ?? '') + JSON.stringify(route.entry.data);
  const ids = new Set<string>();
  for (const m of text.matchAll(/\/slownik\/#([a-z0-9-]+)/g)) ids.add(m[1]);
  return [...ids].map((id) => `${SITE.url}/slownik/#${id}`);
}

function webPageTypeFor(route: SiteRoute): WebPageType {
  if (route.kind !== 'page') return 'WebPage';
  const layout = (route.entry as PageEntry).data.template;
  if (layout === 'contact') return 'ContactPage';
  if (layout === 'person') return 'ProfilePage';
  if (layout === 'catalogue-index' || layout === 'wiedza-index') return 'CollectionPage';
  if (route.path === '/o-nas/') return 'AboutPage';
  return 'WebPage';
}

export async function pageContext(route: SiteRoute, extraNodes: (JsonLdNode | null)[] = []): Promise<PageContext> {
  const d = route.entry.data;
  const path = route.path;
  const url = absoluteUrl(path);
  const noindex = !route.indexable;
  const person = await getPerson(d.author);
  const authorName = displayName(person);
  const crumbs = breadcrumbsFor(route);
  const ogImage = `${SITE.url}/og/${ogKeyFor(path)}.png`;
  const title = d.title;
  const seoTitle = d.seoTitle ?? (path === '/' ? `${SITE.name} — ${SITE.tagline.toLowerCase()}` : `${title} · ${SITE.name}`);
  const authorId = authorIdFor(person);
  const hasCrumbs = path !== '/';

  const nodes: (JsonLdNode | null)[] = [organizationNode(), websiteNode(), personNode(person)];
  let mainEntityId: string | undefined;

  if (route.kind === 'pillar' || route.kind === 'solution') {
    const serviceType =
      route.kind === 'pillar'
        ? ((route.entry as PillarEntry).data.serviceType ?? PILLAR_SERVICE[(route.entry as PillarEntry).data.pillar])
        : `Pośrednictwo ubezpieczeniowe: ${shortTitle(title)}`;
    nodes.push(serviceNode({ url, name: shortTitle(title), description: d.description, serviceType }));
    mainEntityId = `${url}#service`;
  }
  if (route.kind === 'article' || route.kind === 'regulation') {
    nodes.push(
      articleNode({
        url,
        path,
        type: route.kind === 'article' ? 'BlogPosting' : 'Article',
        headline: title,
        description: d.description,
        published: d.published,
        updated: d.updated,
        authorId,
        ogImage,
        keywords: [d.keywords.primary, ...d.keywords.secondary].filter((k): k is string => !!k),
        citations: d.sources.map((s) => ({ title: s.title, url: s.url })),
        mentionTermIds: glossaryMentions(route),
      }),
    );
    mainEntityId = `${url}#article`;
  }
  for (const n of extraNodes) {
    if (!n) continue;
    nodes.push(n);
    if (!mainEntityId && typeof n['@id'] === 'string') mainEntityId = n['@id'];
  }
  if (route.kind === 'page' && path === '/') mainEntityId = undefined;

  nodes.push(
    webPageNode({
      url,
      path,
      type: webPageTypeFor(route),
      name: stripInlineMd(d.machineTitle ?? title),
      description: d.description,
      published: d.published,
      updated: d.updated,
      hasBreadcrumb: hasCrumbs,
      ogImage,
      authorId,
      reviewedById: route.kind === 'page' ? undefined : authorId,
      mainEntityId,
      aboutId: path === '/' ? `${SITE.url}/#org` : undefined,
    }),
  );
  if (hasCrumbs) nodes.push(breadcrumbNode(url, crumbs));
  nodes.push(faqNode(url, d.faq));

  return {
    route,
    path,
    url,
    title,
    seoTitle,
    description: d.description,
    ogTitle: d.ogTitle ?? title,
    ogImage,
    mdPath: noindex ? null : mdPathFor(path),
    noindex,
    draft: route.draft,
    crumbs,
    person,
    authorName,
    jsonld: graph(nodes),
  };
}
